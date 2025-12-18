import { OpConfig } from '@terascope/types';

export interface ConnectionMapping {
    [key: string]: string;
}

export interface RouteSenderConfig extends OpConfig {
    routing: ConnectionMapping;
    _api_name: string;
}
