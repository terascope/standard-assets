import { OpConfig } from '@terascope/job-components';

export interface CountByField {
    op_name: string;
}

export interface CountByFieldConfig extends OpConfig {
    field: string;
    metric_api_name: string;
    collect_metrics: boolean;
}
