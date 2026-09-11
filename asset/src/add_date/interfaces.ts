import { DateFormat, OpConfig } from '@terascope/types';

export interface AddDateConfig extends OpConfig {
    field: string;
    format: DateFormat | string;
    overwrite: boolean;
}
