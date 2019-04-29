'use strict';

const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class Window extends BatchProcessor {
    constructor(...args) {
        super(...args);
        this.events = this.context.apis.foundation.getSystemEvents();
        this.shuttingDown = false;
        this.windows = new Map();
        this.results = [];
        this.empty_slice_count = 0;
    }

    _millisecondTime(time) {
        return isNaN(time) ? Date.parse(time) : +time;
    }

    _setTime(doc) {
        if (this.opConfig.window_time_setting === 'clock') {
            this.time = new Date().getTime();
        } else {
            this.time = this._millisecondTime(doc[this.opConfig.time_field]);
        }
    }

    _closeExpiredWindows() {
        for (const key of this.windows.keys()) {
            if ((this.time - key) > this.opConfig.window_length) {
                this.results.push(this.windows.get(key));
                this.windows.delete(key);
            }
        }
    }

    _ensureOpenWindow() {
        if (this.windows.size === 0
        || (this.opConfig.window_type === 'sliding'
        // current time - most recent window start time > interval time
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

    _eventWindowsExpired() {
        return this.opConfig.window_time_setting === 'event' && this.opConfig.event_window_expiration !== 0
        && this.empty_slice_count > this.opConfig.event_window_expiration;
    }

    onBatch(dataArray) {
        this.results = [];

        // need to track empty slices for event window expiration
        if (dataArray.length === 0) this.empty_slice_count += 1;
        else this.empty_slice_count = 0;

        this.events.on('workers:shutdown', () => {
            this.shuttingDown = true;
        });

        dataArray.forEach((doc) => {
            if (doc[this.opConfig.time_field] === undefined) return;

            this._setTime(doc);

            this._closeExpiredWindows();

            this._ensureOpenWindow();

            this._assignWindow(doc);
        });

        if (this.opConfig.window_time_setting === 'clock') {
            this._setTime();
            this._closeExpiredWindows();
        }

        if (this.shuttingDown === true || this._eventWindowsExpired()) {
            this._dumpWindows();
        }

        return this.results;
    }
}

module.exports = Window;
