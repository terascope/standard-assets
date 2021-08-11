import { OpConfig } from '@terascope/job-components';

export enum DateResolution {
    daily = 'daily',
    monthly = 'monthly',
    yearly = 'yearly',
    weekly = 'weekly'
}

export interface DateRouterConfig extends OpConfig {
    field: string;
    field_delimiter: string;
    value_delimiter: string;
    resolution: string;
    include_date_units: boolean;
}
