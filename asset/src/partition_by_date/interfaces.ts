import { OpConfig } from '@terascope/job-components';

export interface PartitionByDateConfig extends OpConfig {
    field: string;
    delimiter: string;
    resolution: string;
}
