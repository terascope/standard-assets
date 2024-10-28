import { OpConfig } from '@terascope/job-components';

export interface FilterByUnknownFieldsConfig extends OpConfig {
    known_fields: string[];
    invert: boolean;
}
