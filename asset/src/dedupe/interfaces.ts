import { OpConfig } from '@terascope/job-components';

export interface DedupConfig extends OpConfig {
    field: string;
    adjust_time: AdjustTime[];
}

export interface AdjustTime {
    preference: 'oldest' | 'newest';
    field: string;
}
