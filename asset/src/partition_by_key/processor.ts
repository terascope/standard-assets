import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { PartionByKeyConfig } from './interfaces';

export default class PartitionByKey extends BatchProcessor<PartionByKeyConfig> {
    addPath(record: DataEntity) {
        const key = record.getKey();

        record.setMetadata(
            '_partition',
            key,
        );
    }

    async onBatch(records: DataEntity[]) {
        for (const record of records) {
            this.addPath(record);
        }
        return records;
    }
}
