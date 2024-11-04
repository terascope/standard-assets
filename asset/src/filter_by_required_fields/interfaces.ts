import { OpConfig } from '@terascope/types';

export enum LogicType {
    AND = 'and',
    OR = 'or'
}

export interface FilterByRequiredFieldConfig extends OpConfig {
    required_fields: string[];
    filter_type: LogicType;
    invert: boolean;
}
