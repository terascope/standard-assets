import { BatchProcessor, DataEntity } from '@terascope/job-components';
import fnv1a from '@sindresorhus/fnv1a';
import { PartitionByHashConfig } from './interfaces';

class PartitionByDate extends BatchProcessor<PartitionByHashConfig> {
    addPath(record: DataEntity) {
        let hashString = '';

        this.opConfig.fields.forEach((field) => {
            hashString += `${record[field]}`;
        });

        const partition = fnv1a(hashString) % this.opConfig.partitions;
        // TODO: what should this look like?
        record.setMetadata(
            'standard:partition',
            `partition=${partition}`
        );
    }

    async onBatch(records: DataEntity[]) {
        for (const record of records) {
            this.addPath(record);
        }
        return records;
    }
}

module.exports = PartitionByDate;
