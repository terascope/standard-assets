
import { OpConfig } from '@terascope/job-components';

export interface AccumulateByKeyConfig extends OpConfig {
    empty_after: number;
    key_field: string;
    batch_return: boolean;
    batch_size: number;
    flush_data_on_shutdown: boolean;
    order: string;
}
