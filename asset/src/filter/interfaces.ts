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
    data_mate_function?: string;
    data_mate_args?: any;
    drop_to_dlq: boolean;
    regex_flags: string;
    exception_rules?: ExceptionRule[];
}
