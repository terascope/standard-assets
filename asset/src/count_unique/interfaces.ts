import { OpConfig } from '@terascope/types';

export interface CountUniqueConfig extends OpConfig {
    preserve_fields: string[];
    field: string;
    is_meta_field: boolean;
}
