import { OpConfig } from '@terascope/job-components';

export interface DedupConfig extends OpConfig {
    field: string;
    adjust_time: boolean;
}
