import { OpConfig } from '@terascope/types';

export interface CopyFieldConfig extends OpConfig {
    source: string;
    destination: string;
    delete_source: boolean;
}
