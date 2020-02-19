import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { PartitionByFieldsConfig } from './interfaces';

export default class PartitionByFields extends BatchProcessor<PartitionByFieldsConfig> {
    addPath(record: DataEntity) {
        const partitions: string[] = [];

        this.opConfig.fields.forEach((field) => {
            partitions.push(`${field}=${record[field].replace(/=/gi, '_')}`.replace(/\//gi, '_'));
        });

        record.setMetadata(
            'standard:partition',
            partitions.join(this.opConfig.delimiter)
        );
    }

    async onBatch(records: DataEntity[]) {
        for (const record of records) {
            this.addPath(record);
        }
        return records;
    }
}
