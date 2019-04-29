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
        const groupByValue = doc[this.opConfig.field_name];
        if (!this.groups.has(groupByValue)) {
            this.groups.set(groupByValue, []);
        }

        this.groups.get(groupByValue).push(doc);
    }

    onBatch(dataArray) {
        this.groups.clear();

        dataArray.forEach((doc) => {
            if (doc instanceof DataWindow) {
                doc.asArray().forEach(item => this._group(item));
            } else {
                this._group(doc);
            }
        });

        return [...this.groups]
            .reduce((results, [key, value]) => [...results, DataWindow.make(key, value)], []);
    }
}

module.exports = GroupBy;
