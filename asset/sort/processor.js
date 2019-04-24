'use strict';

const Timsort = require('timsort');

const { BatchProcessor, DataEntity } = require('@terascope/job-components');
const { sortFunction } = require('../__lib/utils');

const DataWindow = require('../__lib/data-window');

class Sort extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.sort = sortFunction(this.opConfig.sort_field, this.opConfig.order);
    }

    onBatch(dataArray) {
        if (dataArray.length > 0 && (dataArray[0] instanceof DataWindow
            // This second clause is a hack to work around a framework limitation
            || (dataArray[0] instanceof DataEntity && dataArray[1] instanceof DataWindow))) {
            dataArray.forEach((entry) => {
                if (entry instanceof DataWindow) {
                    Timsort.sort(entry, this.sort);
                }
            });
        } else {
            Timsort.sort(dataArray, this.sort);
        }

        return dataArray;
    }
}

module.exports = Sort;
