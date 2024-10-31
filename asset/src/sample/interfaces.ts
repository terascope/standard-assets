import { OpConfig } from '@terascope/types';

export interface SampleConfig extends OpConfig {
    percentage: number;
    shuffle: boolean;
}
