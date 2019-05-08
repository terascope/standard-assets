'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const { sortFunction } = require('../__lib/utils');
const DataWindow = require('../__lib/data-window');

class AccumulateByKey extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.buckets = new Map();
        this.emptySliceCount = 0;
        this.events = this.context.apis.foundation.getSystemEvents();
        this.shuttingDown = false;
        this.sort = sortFunction(this.opConfig.sort_field, this.opConfig.order);
    }

    _readyToEmpty() {
        return (this.emptySliceCount >= this.opConfig.empty_after)
            && this.buckets.size > 0;
    }


    _batchData() {
        const result = [];
        let resultSize = 0;

        if (this.opConfig.uniq_values === true) this._dedup();

        if (this.opConfig.batch_return === true) {
            const dataWindowKeys = this.buckets.keys();

            while (resultSize < this.opConfig.batch_size && this.buckets.size !== 0) {
                const key = dataWindowKeys.next().value;
                result.push(this.buckets.get(key));
                resultSize += this.buckets.get(key).asArray().length;
                this.buckets.delete(key);
            }
        } else {
            for (const dataWindow of this.buckets.values()) {
                result.push(dataWindow);
            }
            this.buckets.clear();
        }

        return result;
    }

    _accumulate(dataArray) {
        this.emptySliceCount = 0;

        dataArray.forEach((doc) => {
            let key;

            if (this.opConfig.key_field === '_key') key = doc.getMetadata('_key');
            else key = doc[this.opConfig.key_field];

            if (key === undefined) return;

            if (Buffer.isBuffer(key)) {
                key = key.toString('utf8');
            }

            if (!this.buckets.has(key)) {
                this.buckets.set(key, DataWindow.make(key));
            }

            this.buckets.get(key).set(doc);
        });
    }

    onBatch(dataArray) {
        // on shutdown event return accumulated data
        this.events.on('worker:shutdown', () => {
            this.shuttingDown = true;
        });

        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if (this._readyToEmpty() || this.shuttingDown === true) return this._batchData();

        return [];
    }
}

module.exports = AccumulateByKey;
