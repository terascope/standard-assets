import { OpConfig } from '@terascope/types';

export interface DedupeConfig extends OpConfig {
    field: string;
    adjust_time: AdjustTime[];
}

export interface AdjustTime {
    preference: 'oldest' | 'newest';
    field: string;
}
