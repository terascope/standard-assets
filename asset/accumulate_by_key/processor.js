'use strict';

const _ = require('lodash');

const { BatchProcessor, DataEntity } = require('@terascope/job-components');

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

    _createWindow(key) {
        const window = new DataWindow();
        window.setMetadata('_key', key);
        return window;
    }

    _accumulate(dataArray) {
        this.emptySliceCount = 0;

        dataArray.forEach((doc) => {
            const key = DataEntity.getMetadata(doc, '_key');
            if (!this.buckets[key]) {
                this.buckets[key] = this._createWindow(key);
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
