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
    }

    _millisecondTime(time) {
        return isNaN(time) ? Date.parse(time) : +time;
    }

    _assigner(doc) {
        const eventTime = this._millisecondTime(doc[this.opConfig.time_field]);

        if (this.windows.size === 0) {
            let startTime = eventTime;
            if (this.opConfig.time_type === 'clock') startTime = new Date().getTime();

            this.windows.set(startTime, DataWindow.make(startTime));
        }

        if (this.opConfig.window_type === 'sliding') {
            if ((eventTime - _.max(Array.from(this.windows.keys()))
                > this.opConfig.sliding_window_interval)) {
                this.windows.set(eventTime, DataWindow.make(eventTime));
            }
        }

        for (const window of this.windows.values()) {
            window.set(doc);

            if (this.opConfig.time_type === 'event') {
                window.latest_time = eventTime;
            }
        }
    }

    onBatch(dataArray) {
        this.events.on('workers:shutdown', () => {
            this.shuttingDown = true;
        });

        const results = [];
        dataArray.forEach((doc) => {
            this._assigner(doc);
        });

        for (const key of this.windows.keys()) {
            const endTime = this.opConfig.time_type === 'clock' ? new Date().getTime() : this.windows.get(key).latest_time;
            if ((endTime - key) > this.opConfig.window_size) {
                // if window is expired then remove from windows and add to results
                results.push(this.windows.get(key));

                this.windows.delete(key);
            }
        }

        return results;
    }
}

module.exports = Window;
