import { OpConfig } from '@terascope/types';

export interface CountByField {
    op_name: string;
}

export interface CountByFieldConfig extends OpConfig {
    field: string;
    collect_metrics: boolean;
}
