import { DataEntity } from '@terascope/core-utils';
import { BatchProcessor } from '@terascope/job-components';
import DataWindow from '../__lib/data-window.js';
import { DedupeConfig } from './interfaces.js';
import { getTime } from '../__lib/utils.js';

export default class Dedupe extends BatchProcessor<DedupeConfig> {
    async onBatch(dataArray: DataWindow[] | DataEntity[]): Promise<DataEntity[]> {
        if (isDataWindows(dataArray)) return this._dedupeDataWindows(dataArray);

        return this._dedupe(dataArray);
    }

    _dedupeDataWindows(dataWindow: DataWindow[]): DataWindow[] {
        dataWindow.forEach((window: DataWindow) => {
            window.dataArray = this._dedupe(window.dataArray);
        });

        return dataWindow;
    }

    _dedupe(dataArray: DataEntity[]): DataEntity[] {
        const uniqDocs = new Map();

        dataArray.forEach((doc) => {
            const key = this._getKey(doc);

            if (uniqDocs.has(key)) {
                this._adjustTimes(uniqDocs.get(key), doc);

                return;
            }

            uniqDocs.set(key, doc);
        });

        return [...uniqDocs.values()];
    }

    _getKey(entity: DataEntity | DataWindow): string | number {
        if (this.opConfig.field) return entity[this.opConfig.field];

        return entity.getKey();
    }

    _adjustTimes(saved: DataEntity, incoming: DataEntity): void {
        this.opConfig.adjust_time.forEach((time) => {
            const { field, preference } = time;

            saved[field] = this._preferredTime(saved[field], incoming[field], preference);
        });
    }

    _preferredTime(
        savedTime: string, incomingTime: string, preference: string
    ): string | undefined {
        const saved = getTime(savedTime);
        const incoming = getTime(incomingTime);

        if (!saved && incoming) return incomingTime;

        if (saved && incoming) {
            const incomingNewest = incoming > saved;

            if ((preference === 'newest' && incomingNewest) || (preference === 'oldest' && !incomingNewest)) {
                return incomingTime;
            }
        }

        return savedTime;
    }
}

function isDataWindows(input: any): input is DataWindow[] {
    return input.length > 0 && input[0] instanceof DataWindow;
}
