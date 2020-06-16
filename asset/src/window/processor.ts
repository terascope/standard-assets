import { BatchProcessor, DataEntity } from '@terascope/job-components';
import DataWindow from '../__lib/data-window';
import { WindowConfig } from './interfaces';
import { getTime } from '../__lib/utils';

export default class Window extends BatchProcessor<WindowConfig> {
    flushWindows = false;
    windows = new Map<number, DataWindow>();
    results: DataWindow[] = [];
    time!: number;

    onFlushStart(): void {
        this.flushWindows = true;
    }

    onFlushEnd(): void {
        this.flushWindows = false;
    }

    _setTime(doc?: Record<string, any>): void {
        if (this.opConfig.window_time_setting === 'clock') {
            this.time = Date.now();
        } else if (doc) {
            const value = doc[this.opConfig.time_field];
            const newTime = getTime(value);

            if (newTime) {
                this.time = newTime;
            } else {
                this.logger.warn(`could not create a window time from value: "${value}"`);
            }
        }
    }

    _closeExpiredWindows(): void {
        for (const key of this.windows.keys()) {
            if (this.time - key > this.opConfig.window_length) {
                const window = this.windows.get(key);

                if (window) this.results.push(window);
                this.windows.delete(key);
            }
        }
    }

    _ensureOpenWindow(): void {
        if (this.windows.size === 0 || (
            // calculate new sliding window (current time - newest window) > sliding interval
            this.opConfig.window_type === 'sliding'
            && (this.time - Math.max(...this.windows.keys()))
            >= this.opConfig.sliding_window_interval
        )) {
            this.windows.set(this.time, DataWindow.make());
        }
    }

    _dumpWindows(): void {
        for (const window of this.windows.values()) {
            this.results.push(window);
        }

        this.windows.clear();
    }

    _assignWindow(doc: DataWindow): void {
        for (const window of this.windows.values()) {
            window.set(doc);
        }
    }

    async onBatch(dataArray: DataWindow[]): Promise<DataEntity[]> {
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
                const createTime = value.getMetadata('_createTime') || value.getMetadata('createdAt');
                const elapsed = (Date.now() - createTime);

                if (elapsed > this.opConfig.event_window_expiration) {
                    const window = this.windows.get(key);
                    if (window) this.results.push(window);
                    this.windows.delete(key);
                }
            }
        }

        if (this.flushWindows === true) this._dumpWindows();

        return this.results as DataEntity[];
    }
}
