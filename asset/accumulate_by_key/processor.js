'use strict';

const { BatchProcessor } = require('@terascope/job-components');

const DataWindow = require('../__lib/data-window');

class AccumulateByKey extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.buckets = new Map();
        this.emptySliceCount = 0;
        this.events = this.context.apis.foundation.getSystemEvents();
        this.shuttingDown = false;
    }

    _readyToEmpty() {
        return (this.emptySliceCount >= this.opConfig.empty_after)
            && this.buckets.size > 0;
    }

    _batchData() {
        const result = [];

        if (this.opConfig.batch_return === true || this.buckets.size > this.opConfig.batch_size) {
            const dataWindows = this.buckets.keys();

            while (result.length < this.opConfig.batch_size) {
                const key = dataWindows.next().value;
                result.push(this.buckets.get(key));
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
            const key = this.opConfig.key_field === '_key' ? doc.getMetadata('_key') : doc[this.opConfig.key_field];

            if (key === undefined) return;

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
