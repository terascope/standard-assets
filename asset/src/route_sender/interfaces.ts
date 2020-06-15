import { OpConfig } from '@terascope/job-components';

export interface ConnectionMapping {
    [key: string]: string;
}

export interface RouteSenderConfig extends OpConfig {
    size: number;
    connection_map: ConnectionMapping;
    multisend: boolean;
    multisend_index_append: boolean;
    connection: string;
}
