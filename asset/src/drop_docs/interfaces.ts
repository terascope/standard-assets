import { OpConfig } from '@terascope/types';

export interface DropDocConfig extends OpConfig {
    percentage: number;
    shuffle: boolean;
}
