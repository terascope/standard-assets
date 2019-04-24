'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class Accumulate extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.records = [];
        this.emptySliceCount = 0;
    }

    _readyToEmpty() {
        return this.emptySliceCount >= this.opConfig.empty_after;
    }

    _accumulate(dataArray) {
        // Empty slices need to be together
        this.emptySliceCount = 0;

        dataArray.forEach(doc => this.records.push(doc));
    }

    onBatch(dataArray) {
        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if (this._readyToEmpty()) {
            const results = this.records;
            this.records = [];

            if (this.use_data_window === true) {
                // TODO: the key should be configurable, but is it a key from a doc?  A specific value?
                return DataWindow.make('key', results);
            }

            return results;
        }

        return [];
    }
}

module.exports = Accumulate;
