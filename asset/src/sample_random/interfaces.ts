import { OpConfig } from '@terascope/types';

export interface SampleRandomConfig extends OpConfig {
    probability_to_keep: number;
}
