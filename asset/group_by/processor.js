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
        let key;

        if (this.opConfig.field) key = doc[this.opConfig.field];
        else key = DataWindow.getMetadata(doc, '_key');

        if (Buffer.isBuffer(key)) {
            key.toString('utf8');
        }

        if (!this.groups.has(key)) {
            this.groups.set(key, []);
        }

        this.groups.get(key).push(doc);
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
