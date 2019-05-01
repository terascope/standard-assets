'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

/*
    handles an array of data entities or an array of data windows
*/

class GroupBy extends BatchProcessor {
    constructor(...args) {
        super(...args);
        this.groups = new Map();
    }

    _group(doc) {
        const groupByValue = this.opConfig.field === undefined ? doc.getMetadata('_key') : doc[this.opConfig.field];

        if (!this.groups.has(groupByValue)) {
            this.groups.set(groupByValue, []);
        }

        this.groups.get(groupByValue).push(doc);
    }

    onBatch(dataArray) {
        dataArray.forEach((doc) => {
            if (doc instanceof DataWindow) {
                doc.asArray().forEach(item => this._group(item));
            } else {
                this._group(doc);
            }
        });

        const results = [];

        for (const [key, value] of this.groups.entries()) {
            results.push(DataWindow.make(key, value));
        }

        this.groups.clear();
        return results;
    }
}

module.exports = GroupBy;
