import { OpConfig } from '@terascope/types';

export interface CreateGeopointConfig extends OpConfig {
    lat_field: string;
    lon_field: string;
    destination_field: string;
    delete_source: boolean;
}
