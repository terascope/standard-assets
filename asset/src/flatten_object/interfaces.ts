import { OpConfig } from '@terascope/types';

export enum MissingFieldAction {
    throw = 'throw',
    log = 'log',
    ignore = 'ignore'
}

export interface FlattenObjectConfig extends OpConfig {
    /** null flattens the whole record */
    field: string | string[] | null;
    delimiter: string;
    flatten_arrays: boolean;
    max_depth: number;
    missing_field_action: MissingFieldAction;
}
