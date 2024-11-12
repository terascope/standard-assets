import { OpConfig } from '@terascope/job-components';

export interface SetFieldConditionalConfig extends OpConfig {
    conditional_field: string;
    conditional_values: any[];
    set_field: string;
    value: any;
}
