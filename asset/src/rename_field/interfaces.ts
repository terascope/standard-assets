import { OpConfig } from '@terascope/types';

export interface RenameFieldConfig extends OpConfig {
    mapping: Record<string, string>;
}
