'use strict';

const _ = require('lodash');

const { BatchProcessor } = require('@terascope/job-components');

const DataWindow = require('../__lib/data-window');

class AccumulateByKey extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.buckets = {};

        this.emptySliceCount = 0;
    }

    _readyToEmpty() {
        return (this.emptySliceCount >= this.opConfig.empty_after)
            && _.keys(this.buckets).length > 0;
    }

    _batchData() {
        // The return value from this is an array of keyed DataWindows.
        const result = [];
        _.keys(this.buckets).forEach((key) => {
            result.push(this.buckets[key]);
        });

        this.buckets = {};

        return result;
    }

    _accumulate(dataArray) {
        this.emptySliceCount = 0;

        dataArray.forEach((doc) => {
            const key = this.opConfig.key_field === '_key' ? doc.getMetadata('_key') : doc[this.opConfig.key_field];

            if (key === undefined) return;

            if (!this.buckets[key]) {
                this.buckets[key] = DataWindow.make(key);
            }

            this.buckets[key].set(doc);
        });
    }

    onBatch(dataArray) {
        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if (this._readyToEmpty()) return this._batchData();

        return [];
    }
}

module.exports = AccumulateByKey;
