import { OpConfig } from '@terascope/types';

export interface ConnectionMapping {
    [key: string]: string;
}

export interface RouteSenderConfig extends OpConfig {
    size: number;
    routing: ConnectionMapping;
    api_name: string,
    concurrency: number
}
