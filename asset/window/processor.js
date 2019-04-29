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
        || (this.opConfig.window_type === 'sliding' && (this.time - this.last_window)
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
        for (const window of this.windows.values()) window.set(doc);
    }

    onBatch(dataArray) {
        this.results = [];

        this.events.on('workers:shutdown', () => {
            this.shuttingDown = true;
        });

        dataArray.forEach((doc) => {
            if (doc[this.opConfig.time_field] === undefined) return;

            // clock or event time
            this._setTime(doc);

            this._closeExpiredWindows();

            this._ensureOpenWindow();

            this._assignWindow(doc);

            // last_window is used in sliding window calc and post slice window expiration
            this.last_window = Math.max(...Array.from(this.windows.keys()));
        });

        // clock time based windows are also checked after every slice
        if (this.opConfig.window_time_setting === 'clock') {
            this._setTime();
            this._closeExpiredWindows();
        }

        if (this.shuttingDown === true
            // can return event based windows if no incoming data over a period of time
            || (dataArray.length === 0 && this.opConfig.event_window_expiration > 0 && this.opConfig.window_time_setting === 'event'
            && (new Date().getTime() - this.last_window) > this.opConfig.event_window_expiration)
        ) {
            this._dumpWindows();
        }

        return this.results;
    }
}

module.exports = Window;
