'use strict';

const Timsort = require('timsort');

const { BatchProcessor } = require('@terascope/job-components');
const { sortFunction } = require('../__lib/utils');

const DataWindow = require('../__lib/data-window');

class Sort extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.sort = sortFunction(this.opConfig.sort_field, this.opConfig.order);
    }

    onBatch(dataArray) {
        if (dataArray.length > 0 && dataArray[0] instanceof DataWindow) {
            dataArray.forEach(dataWindow => Timsort.sort(dataWindow.asArray(), this.sort));
        } else {
            Timsort.sort(dataArray, this.sort);
        }

        return dataArray;
    }
}

module.exports = Sort;
