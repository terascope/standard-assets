import { OpConfig } from '@terascope/types';

export interface CopyMetadataFieldConfig extends OpConfig {
    destination: string;
    meta_key: string;
}
