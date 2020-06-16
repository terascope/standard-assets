import { OpConfig, RouteSenderAPI } from '@terascope/job-components';

export interface ConnectionMapping {
    [key: string]: string;
}

export interface RouteSenderConfig extends OpConfig {
    size: number;
    connection_map: ConnectionMapping;
    connection: string;
}

export interface Endpoint {
    client: RouteSenderAPI;
    data: any[];
}

export type RoutingExectuion = Map <string, Endpoint>;
export type RouteDict = Map<string, Record<string, any>>;
