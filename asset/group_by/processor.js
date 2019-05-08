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
        let groupByValue;

        if (this.opConfig.field === 'metadata_key') groupByValue = DataWindow.getMetadata(doc, '_key');
        else groupByValue = doc[this.opConfig.field];

        if (Buffer.isBuffer(groupByValue)) {
            groupByValue.toString('utf8');
        }

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
            const newDataWindow = DataWindow.make(key, value);
            results.push(newDataWindow);
        }

        this.groups.clear();
        return results;
    }
}

module.exports = GroupBy;
