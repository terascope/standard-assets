import { OpConfig } from '@terascope/types';

export interface DateGuardConfig extends OpConfig {
    date_field: string;
    limit_past: string;
    limit_future: string;
}
