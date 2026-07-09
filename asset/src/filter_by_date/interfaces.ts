import { OpConfig } from '@terascope/types';

export interface FilterByDateConfig extends OpConfig {
    date_field: string;
    limit_past: string;
    limit_future: string;
    collect_metrics: boolean;
    _dead_letter_action: string;
}
