'use strict';

const _ = require('lodash');

const { BatchProcessor } = require('@terascope/job-components');

const DataWindow = require('../__lib/data-window');

class Accumulate extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.records = new DataWindow();
        this.emptySliceCount = 0;
    }

    _readyToEmpty() {
        return this.emptySliceCount >= this.opConfig.empty_after;
    }

    _batchData() {
        // We reset for a new accumulation.
        const results = [];
        if (this.records.asArray().length > 0) {
            results.push(this.records);
        }

        this.records = new DataWindow();
        this.emptySliceCount = 0;

        return results;
    }

    _accumulate(dataArray) {
        // Empty slices need to be together
        this.emptySliceCount = 0;

        dataArray.forEach((doc) => {
            this.records.set(doc);
        });
    }

    onBatch(dataArray) {
        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if (this._readyToEmpty()) return this._batchData();

        return [];
    }
}

module.exports = Accumulate;
