import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { FieldValidator, FieldTransform } from '@terascope/data-mate';
import DataWindow from '../__lib/data-window';
import { DedupConfig } from './interfaces';
import { getTime } from '../__lib/utils';

export default class Dedup extends BatchProcessor<DedupConfig> {
    async onBatch(dataArray: DataWindow[] | DataEntity[]): Promise<DataEntity[]> {
        if (isDataWindows(dataArray)) return this._dedupDataWindows(dataArray);

        return this._dedup(dataArray);
    }

    _dedupDataWindows(dataWindow: DataWindow[]): DataWindow[] {
        dataWindow.forEach((window: DataWindow) => {
            window.dataArray = this._dedup(window.dataArray);
        });

        return dataWindow;
    }

    _dedup(dataArray: DataEntity[]): DataEntity[] {
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

            saved[field] = this._preferedTime(saved[field], incoming[field], preference);
        });
    }

    _preferedTime(savedTime: string, incomingTime: string, preference: string): string | undefined {
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
