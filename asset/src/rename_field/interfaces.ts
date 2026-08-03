import { OpConfig } from '@terascope/types';

export interface RenameFieldConfig extends OpConfig {
    field_mapping: Record<string, string>;
}
