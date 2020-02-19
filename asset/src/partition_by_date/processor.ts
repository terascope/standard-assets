import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { PartitionByDateConfig } from './interfaces';

export default class PartitionByDate extends BatchProcessor<PartitionByDateConfig> {
    addPath(record: DataEntity) {
        const partitions: string[] = [];
        const offsets = {
            daily: 10,
            monthly: 7,
            yearly: 4
        };
        // This value is enforced by the schema
        const end = offsets[this.opConfig.resolution];
        const dates = new Date(record[this.opConfig.field]).toISOString().slice(0, end).split('-');
        // Schema enforces one of these formatting options
        if (this.opConfig.resolution === 'yearly') {
            partitions.push(`date_year=${dates[0]}`);
        } else if (this.opConfig.resolution === 'monthly') {
            partitions.push(`date_year=${dates[0]}`);
            partitions.push(`date_month=${dates[1]}`);
        } else {
            partitions.push(`date_year=${dates[0]}`);
            partitions.push(`date_month=${dates[1]}`);
            partitions.push(`date_day=${dates[2]}`);
        }

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
