import { OpConfig } from '@terascope/types';

export interface ExceptionRule {
    field: string;
    value: any;
    regex?: boolean;
}

export interface FilterConfig extends OpConfig {
    field: string | string [];
    value?: any;
    invert: boolean;
    array_index: number;
    filter_by: string;
    validation_function?: string;
    validation_function_args?: any;
    filtered_to_dead_letter_queue: boolean;
    exception_rules?: ExceptionRule[];
}
