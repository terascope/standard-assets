'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class Accumulate extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.records = [];
        this.emptySliceCount = 0;
        this.flushData = false;
        this.shuttingDown = false;
    }

    onFlushStart() {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd() {
        this.flushData = false;
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
        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if ((this._readyToEmpty() || this.flushData === true) && this.records.length > 0) {
            const results = DataWindow.make(this.opConfig.data_window_key, this.records);
            this.records = [];

            return results;
        }

        return [];
    }
}

module.exports = Accumulate;
