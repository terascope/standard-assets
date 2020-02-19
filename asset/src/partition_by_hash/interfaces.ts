import { OpConfig } from '@terascope/job-components';

export interface PartitionByHashConfig extends OpConfig {
    fields: string[];
    partitions: number;
    delimiter: string;
}
