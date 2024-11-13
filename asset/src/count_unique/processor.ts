import { BatchProcessor, DataEntity, has } from '@terascope/job-components';
import { CountUniqueConfig } from './interfaces.js';

export default class CountUnique extends BatchProcessor<CountUniqueConfig> {
    async onBatch(dataArray: DataEntity[]) {
        const results: Record<string, DataEntity> = {};

        for (const doc of dataArray) {
            const key = this._getIdentifier(doc);

            if (!has(results, key)) {
                results[key] = DataEntity.make({
                    count: 0,
                    _key: key
                }, { _key: key });
            }

            results[key].count++;

            this.opConfig.preserve_fields.forEach((field) => {
                if (doc[field] != null) {
                    results[key][field] = doc[field];
                }
            });
        }

        return Object.values(results);
    }

    private _getIdentifier(doc: DataEntity): any {
        if (this.opConfig.is_meta_field) {
            return doc.getMetadata(this.opConfig.field);
        }

        return doc[this.opConfig.field];
    }
}
