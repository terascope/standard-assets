import { OpConfig } from '@terascope/job-components';

export interface PartitionByFieldsConfig extends OpConfig {
    fields: string[];
    delimiter: string;
}
