import { OpConfig } from '@terascope/types';
import { AccumulateConfig } from '../accumulate/interfaces.js';

export interface AccumulateByKeyConfig extends AccumulateConfig, OpConfig {
    key_field: string;
    batch_return: boolean;
    batch_size: number;
}
