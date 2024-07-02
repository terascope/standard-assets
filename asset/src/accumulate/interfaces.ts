import { OpConfig } from '@terascope/types';

export interface AccumulateConfig extends OpConfig {
    empty_after: number;
    flush_data_on_shutdown: boolean;
}
