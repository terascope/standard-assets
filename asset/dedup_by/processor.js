'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class Dedup extends BatchProcessor {
    _millisecondTime(time) {
        return isNaN(time) ? Date.parse(time) : +time;
    }

    _adjustTimes(original, doc) {
        if (this._millisecondTime(doc.first_seen) < this._millisecondTime(original.first_seen)) {
            original.first_seen = doc.first_seen;
        }

        if (this._millisecondTime(doc.last_seen) > this._millisecondTime(original.last_seen)) {
            original.last_seen = doc.last_seen;
        }
    }

    _dedup(dataArray) {
        const uniqDocs = new Map();

        dataArray.forEach((doc) => {
            const key = doc[this.opConfig.dedup_field];
            if (uniqDocs.has(key)) {
                // need to adjust first and last seen
                if (this.opConfig.adjust_time === true) {
                    this._adjustTimes(uniqDocs.get(key), doc);
                }

                return;
            }

            uniqDocs.set(key, doc);
        });

        return [...uniqDocs.values()];
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
