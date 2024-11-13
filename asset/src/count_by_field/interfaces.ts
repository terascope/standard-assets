import { OpConfig } from '@terascope/types';

export interface CountByFieldConfig extends OpConfig {
    field: string;
    collect_metrics: boolean;
}
