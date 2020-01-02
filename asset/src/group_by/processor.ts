import { BatchProcessor, DataEntity } from '@terascope/job-components';
import DataWindow from '../helpers/data-window';
import { GroupByConfig } from './interfaces';

/*
    handles an array of data entities or an array of data windows
*/

export default class GroupBy extends BatchProcessor<GroupByConfig> {
    groups = new Map();

    _group(doc: DataEntity) {
        let key;

        if (this.opConfig.field) key = doc[this.opConfig.field];
        else key = DataWindow.getMetadata(doc, '_key');

        if (Buffer.isBuffer(key)) {
            key.toString('utf8');
        }

        if (!this.groups.has(key)) {
            this.groups.set(key, []);
        }

        this.groups.get(key).push(doc);
    }

    // @ts-ignore
    onBatch(dataArray: DataWindow[] | DataEntity[]) {
        dataArray.forEach((doc: DataWindow | DataEntity) => {
            if (doc instanceof DataWindow) {
                doc.asArray().forEach((item: DataEntity) => this._group(item));
            } else {
                this._group(doc);
            }
        });

        const results = [];

        for (const [key, value] of this.groups.entries()) {
            const newDataWindow = DataWindow.make(key, value);
            results.push(newDataWindow);
        }

        this.groups.clear();
        return results;
    }
}
