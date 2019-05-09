'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class Accumulate extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.records = [];
        this.emptySliceCount = 0;
        this.events = this.context.apis.foundation.getSystemEvents();
        this.shuttingDown = false;
    }

    _readyToEmpty() {
        return this.emptySliceCount >= this.opConfig.empty_after;
    }

    _accumulate(dataArray) {
        // reset empty slice count if break in incoming data
        this.emptySliceCount = 0;

        dataArray.forEach(doc => this.records.push(doc));
    }

    onBatch(dataArray) {
        this.events.on('worker:shutdown', () => {
            this.shuttingDown = true;
        });

        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if ((this._readyToEmpty() || this.shuttingDown === true) && this.records.length > 0) {
            const results = DataWindow.make(this.opConfig.data_window_key, this.records);
            this.records = [];

            return results;
        }

        return [];
    }
}

module.exports = Accumulate;
