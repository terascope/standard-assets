'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class Dedup extends BatchProcessor {
    _dedup(dataArray) {
        const uniqDocs = {};
        const returnUniq = [];

        dataArray.forEach((doc) => {
            if (uniqDocs[doc[this.opConfig.dedup_field]] === true) {
                return;
            }

            uniqDocs[doc[this.opConfig.dedup_field]] = true;
            returnUniq.push(doc);
        });

        return returnUniq;
    }

    onBatch(dataArray) {
        if (dataArray.length > 0 && dataArray[0] instanceof DataWindow) {
            dataArray.forEach((window) => {
                window.dataArray = this._dedup(window.dataArray);
            });

            return dataArray;
        }
        return this._dedup(dataArray);
    }
}

module.exports = Dedup;
