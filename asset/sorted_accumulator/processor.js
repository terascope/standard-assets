'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const _ = require('lodash');
const Timsort = require('timsort');

const { sortFunction } = require('../__lib/utils');

class SortedAccumulator extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.recordArray = [];

        this.sorted = false;
        this.emptySliceCount = 0;
        this.offset = 0;

        this.sort = sortFunction(this.opConfig.sort_field, this.opConfig.order);
    }

    _readyToEmpty() {
        return this.emptySliceCount >= this.opConfig.empty_after;
    }

    _batchOfData() {
        if (!this.sorted) {
            Timsort.sort(this.recordArray, this.sort);
            this.sorted = true;
        }

        // On large arrays this gets progressively slower as you get deeper in the array.
        const results = this.recordArray.slice(this.offset, this.offset + this.opConfig.batch_size);
        this.offset += results.length;

        return results;
    }

    _accumulate(dataArray) {
        dataArray.forEach((doc) => {
            this.recordArray.push(doc);
        });
    }

    onBatch(dataArray) {
        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if (this._readyToEmpty()) return this._batchOfData();

        return [];
    }
}

module.exports = SortedAccumulator;
