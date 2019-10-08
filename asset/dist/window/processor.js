"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const data_window_1 = __importDefault(require("../helpers/data-window"));
class Window extends job_components_1.BatchProcessor {
    constructor() {
        super(...arguments);
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
    // TODO: review this
    _setTime(doc) {
        if (this.opConfig.window_time_setting === 'clock') {
            this.time = Date.now();
        }
        else {
            this.time = this._millisecondTime(doc[this.opConfig.time_field]);
        }
    }
    _closeExpiredWindows() {
        for (const key of this.windows.keys()) {
            if (this.time - key > this.opConfig.window_length) {
                const window = this.windows.get(key);
                if (window)
                    this.results.push(window);
                this.windows.delete(key);
            }
        }
    }
    _ensureOpenWindow() {
        if (this.windows.size === 0
            // calculate new sliding window (current time - newest window) > sliding interval
            || (this.opConfig.window_type === 'sliding'
                // @ts-ignore FIXME:
                && (this.time - Math.max([...this.windows.keys()]))
                    >= this.opConfig.sliding_window_interval)) {
            this.windows.set(this.time, data_window_1.default.make());
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
    // @ts-ignore
    onBatch(dataArray) {
        this.results = [];
        dataArray.forEach((doc) => {
            if (!doc[this.opConfig.time_field])
                return;
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
                const createTime = value.getMetadata('_createTime') || value.getMetadata('createdAt');
                const elapsed = (Date.now() - createTime);
                if (elapsed > this.opConfig.event_window_expiration) {
                    const window = this.windows.get(key);
                    if (window)
                        this.results.push(window);
                    this.windows.delete(key);
                }
            }
        }
        if (this.flushWindows === true)
            this._dumpWindows();
        return this.results;
    }
}
exports.default = Window;
//# sourceMappingURL=processor.js.map