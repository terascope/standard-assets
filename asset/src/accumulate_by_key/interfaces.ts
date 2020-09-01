import { OpConfig } from '@terascope/job-components';
import { AccumulateConfig } from '../accumulate/interfaces';

export interface AccumulateByKeyConfig extends AccumulateConfig, OpConfig {
    key_field: string;
    batch_return: boolean;
    batch_size: number;
}
