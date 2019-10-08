
import { BatchProcessor, DataEntity } from '@terascope/job-components';
import DataWindow from '../helpers/data-window';
import { DedupConfig } from './interfaces';

export default class Dedup extends BatchProcessor<DedupConfig> {
    // TODO: review this
    _millisecondTime(time: any) {
        return isNaN(time) ? Date.parse(time) : +time;
    }

    _adjustTimes(original: DataEntity, doc: DataEntity) {
        if (this._millisecondTime(doc.first_seen) < this._millisecondTime(original.first_seen)) {
            original.first_seen = doc.first_seen;
        }

        if (this._millisecondTime(doc.last_seen) > this._millisecondTime(original.last_seen)) {
            original.last_seen = doc.last_seen;
        }
    }

    _dedup(dataArray: DataEntity[]) {
        const uniqDocs = new Map();

        dataArray.forEach((doc) => {
            let key;

            if (this.opConfig.field) key = doc[this.opConfig.field];
            else key = DataWindow.getMetadata(doc, '_key');

            if (uniqDocs.has(key)) {
                // need to adjust first and last seen
                if (this.opConfig.adjust_time === true) {
                    this._adjustTimes(uniqDocs.get(key), doc);
                }

                return;
            }

            uniqDocs.set(key, doc);
        });

        return [...uniqDocs.values()];
    }
    // @ts-ignore
    onBatch(dataArray: DataWindow[] | DataEntity[]) {
        if (dataArray.length > 0 && dataArray[0] instanceof DataWindow) {
            dataArray.forEach((window) => {
                window.dataArray = this._dedup(window.dataArray);
            });

            return dataArray;
        }
        return this._dedup(dataArray);
    }
}
