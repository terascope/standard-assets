'use strict';

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
        this.window = new DataWindow();
    }

    _millisecondTime(time) {
        return isNaN(time) ? Date.parse(time) : +time;
    }

    _assigner(doc) {
        // check if this is a new window
        if (this.window.start_time === undefined) {
            if (this.opConfig.time_type === 'clock') this.window.start_time = new Date().getTime();
            else this.window.start_time = this._millisecondTime(doc[this.opConfig.time_field]);
        }

        if (this.opConfig.time_type === 'event') {
            this.window.latest_time = this._millisecondTime(doc[this.opConfig.time_field]);
        }

        this.window.set(doc);
    }

    _trigger() {
        const endTime = this.opConfig.time_type === 'clock' ? new Date().getTime() : this.window.latest_time;
        return (endTime - this.window.start_time) > this.opConfig.window_size;
    }

    onBatch(dataArray) {
        this.events.on('workers:shutdown', () => {
            this.shuttingDown = true;
        });

        const results = [];
        dataArray.forEach((doc) => {
            this._assigner(doc);
        });

        if (this._trigger()) {
            results.push(this.window);
            this.window = new DataWindow();
        }

        return results;
    }
}

module.exports = Window;
