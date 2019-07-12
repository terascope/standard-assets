'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class Window extends BatchProcessor {
    constructor(...args) {
        super(...args);
        this.flushWindows = false;
        this.windows = new Map();
        this.results = [];
    }

    onFlushStart() {
        this.flushWindows = true;
    }

    onFlushEnd() {
        this.flushWindows = false;
    }

    _millisecondTime(time) {
        return isNaN(time) ? Date.parse(time) : +time;
    }

    _setTime(doc) {
        if (this.opConfig.window_time_setting === 'clock') {
            this.time = Date.now();
        } else {
            this.time = this._millisecondTime(doc[this.opConfig.time_field]);
        }
    }

    _closeExpiredWindows() {
        for (const key of this.windows.keys()) {
            if (this.time - key > this.opConfig.window_length) {
                this.results.push(this.windows.get(key));
                this.windows.delete(key);
            }
        }
    }

    _ensureOpenWindow() {
        if (this.windows.size === 0
        // calculate new sliding window (current time - newest window) > sliding interval
        || (this.opConfig.window_type === 'sliding'
        && (this.time - Math.max([...this.windows.keys()]))
        >= this.opConfig.sliding_window_interval)) {
            this.windows.set(this.time, DataWindow.make());
        }
    }

    _dumpWindows() {
        for (const window of this.windows.values()) {
            this.results.push(window);
        }

        this.windows.clear();
    }

    _assignWindow(doc) {
        for (const window of this.windows.values()) {
            window.set(doc);
        }
    }

    onBatch(dataArray) {
        this.results = [];

        dataArray.forEach((doc) => {
            if (!doc[this.opConfig.time_field]) return;

            this._setTime(doc);

            this._closeExpiredWindows();

            this._ensureOpenWindow();

            this._assignWindow(doc);
        });

        if (this.opConfig.window_time_setting === 'clock') {
            this._setTime();
            this._closeExpiredWindows();
        }

        // remove expired event based windows
        if (dataArray.length === 0 && this.opConfig.window_time_setting === 'event') {
            for (const [key, value] of this.windows.entries()) {
                if (Date.now() - value.getMetadata('_createTime') > this.opConfig.event_window_expiration) {
                    this.results.push(this.windows.get(key));
                    this.windows.delete(key);
                }
            }
        }

        if (this.flushWindows === true) this._dumpWindows();

        return this.results;
    }
}

module.exports = Window;
