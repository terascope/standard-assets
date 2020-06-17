import { BatchProcessor, DataEntity } from '@terascope/job-components';
import DataWindow from '../__lib/data-window';
import { DedupConfig } from './interfaces';
import { getTime } from '../__lib/utils';

function adjustTimes(original: DataEntity, doc: DataEntity) {
    const origFirstSeen = getTime(original.first_seen);
    const origLastSeen = getTime(original.last_seen);

    const docFirstSeen = getTime(doc.first_seen);
    const docLastSeen = getTime(doc.last_seen);

    if (docFirstSeen && origFirstSeen && docFirstSeen < origFirstSeen) {
        original.first_seen = doc.first_seen;
    }

    if (docLastSeen && origLastSeen && docLastSeen > origLastSeen) {
        original.last_seen = doc.last_seen;
    }
}

export default class Dedup extends BatchProcessor<DedupConfig> {
    _dedup(dataArray: DataEntity[]): DataEntity[] {
        const uniqDocs = new Map();

        dataArray.forEach((doc) => {
            let key;

            if (this.opConfig.field) key = doc[this.opConfig.field];
            else key = DataWindow.getMetadata(doc, '_key');

            if (uniqDocs.has(key)) {
                // need to adjust first and last seen
                if (this.opConfig.adjust_time === true) {
                    adjustTimes(uniqDocs.get(key), doc);
                }

                return;
            }

            uniqDocs.set(key, doc);
        });

        return [...uniqDocs.values()];
    }

    async onBatch(dataArray: DataWindow[] | DataEntity[]): Promise<DataEntity[]> {
        if (isDataWindows(dataArray)) {
            dataArray.forEach((window) => {
                window.dataArray = this._dedup(window.dataArray);
            });

            return dataArray;
        }
        return this._dedup(dataArray);
    }
}

function isDataWindows(input: any): input is DataWindow[] {
    return input.length > 0 && input[0] instanceof DataWindow;
}
