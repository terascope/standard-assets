import { OpConfig } from '@terascope/types';

export interface CreateGeopointConfig extends OpConfig {
    lat_field: string;
    lon_field: string;
    destination: string;
    delete_source: boolean;
}
