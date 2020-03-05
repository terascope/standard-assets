import { OpConfig } from '@terascope/job-components';

export interface FieldRouterConfig extends OpConfig {
    fields: string[];
    field_delimiter: string;
    value_delimiter: string;
}
