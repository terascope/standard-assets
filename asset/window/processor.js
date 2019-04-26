'use strict';

const _ = require('lodash');
const { BatchProcessor } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

/*
    accumulates data during window period
    once window expires data is returned
*/


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
        if (this.opConfig.time_type === 'clock') {
            this.time = new Date().getTime();
        } else {
            this.time = this._millisecondTime(doc[this.opConfig.time_field]);
        }
    }

    _closeExpiredWindows() {
        for (const key of this.windows.keys()) {
            if ((this.time - key) > this.opConfig.window_size) {
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
    }

    _assignWindow(doc) {
        // add the doc to the correct window(s)
        for (const window of this.windows.values()) window.set(doc);
    }

    onBatch(dataArray) {
        this.results = [];
        this.events.on('workers:shutdown', () => {
            this.shuttingDown = true;
        });

        dataArray.forEach((doc) => {
            if (doc[this.opConfig.time_field] === undefined) return;

            // based on clock or event time
            this._setTime(doc);

            this._closeExpiredWindows();

            this._ensureOpenWindow();

            this._assignWindow(doc);

            this.last_window = _.max(Array.from(this.windows.keys()));
        });

        if (this.shuttingDown === true
            // clock timed windows are checked after every slice
            || (this.opConfig.time_type === 'clock'
            && (new Date().getTime() - this.last_window) > this.opConfig.window_size)
            // if event based then a limit on how long to hold the docs makes sense
            || (dataArray.length === 0 && this.opConfig.event_window_expiration > 0 && this.opConfig.time_type === 'event'
            && (new Date().getTime() - this.last_window) > this.opConfig.event_window_expiration)
        ) {
            this._dumpWindows();
        }

        return this.results;
    }
}

module.exports = Window;
