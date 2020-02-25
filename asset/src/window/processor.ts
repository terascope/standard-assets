import { BatchProcessor } from '@terascope/job-components';
import DataWindow from '../__lib/data-window';
import { WindowConfig } from './interfaces';
import { getTime } from '../__lib/utils';

export default class Window extends BatchProcessor<WindowConfig> {
    flushWindows = false;
    windows = new Map<number, DataWindow>();
    results: DataWindow[] = [];
    time!: number;

    onFlushStart() {
        this.flushWindows = true;
    }

    onFlushEnd() {
        this.flushWindows = false;
    }

    _setTime(doc?: any) {
        if (this.opConfig.window_time_setting === 'clock') {
            this.time = Date.now();
        } else {
            const value = doc[this.opConfig.time_field];
            const newTime = getTime(value);
            if (newTime) {
                this.time = newTime;
            } else {
                this.logger.warn(`could not create a window time from value: "${value}"`);
            }
        }
    }

    _closeExpiredWindows() {
        for (const key of this.windows.keys()) {
            console.log(this.time, key, this.opConfig.window_length, this.time - key > this.opConfig.window_length)
            if (this.time - key > this.opConfig.window_length) {
                const window = this.windows.get(key);
                if (window) this.results.push(window);
                this.windows.delete(key);
            }
        }
    }

    _ensureOpenWindow() {
        if (this.windows.size === 0
        // calculate new sliding window (current time - newest window) > sliding interval
        || (this.opConfig.window_type === 'sliding'
        && (this.time - Math.max(...this.windows.keys()))
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

    _assignWindow(doc: DataWindow) {
        for (const window of this.windows.values()) {
            window.set(doc);
        }
    }
    // @ts-ignore
    onBatch(dataArray: DataWindow[]) {
        this.results = [];
        console.log({ dataArray })
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
            console.log('im not here')
            for (const [key, value] of this.windows.entries()) {
                const createTime = value.getMetadata('_createTime') || value.getMetadata('createdAt');
                const elapsed = (Date.now() - createTime);

                if (elapsed > this.opConfig.event_window_expiration) {
                    console.log('i have elapsed')
                    const window = this.windows.get(key);
                    if (window) this.results.push(window);
                    this.windows.delete(key);
                }
            }
        }

        if (this.flushWindows === true) this._dumpWindows();

        return this.results;
    }
}
