import { OpConfig } from '@terascope/types';

export interface KeepFieldConfig extends OpConfig {
    field: string | string[];
}
