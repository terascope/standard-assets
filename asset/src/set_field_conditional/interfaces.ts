import { OpConfig } from '@terascope/job-components';

export interface SetFieldConditionalConfig extends OpConfig {
    check_name: string;
    check_values: any[];
    set_name: string;
    set_value: any;
    create_check_field: boolean;
}
