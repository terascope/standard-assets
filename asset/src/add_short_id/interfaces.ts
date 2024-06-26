import { OpConfig } from '@terascope/types';

export interface UniqueIdOpConfig extends OpConfig {
    length: number;
    field: string;
    dictionary: 'number' | 'alpha' | 'alpha_lower' | 'alpha_upper' | 'alphanum' | 'alphanum_lower' | 'alphanum_upper' | 'hex';
}
