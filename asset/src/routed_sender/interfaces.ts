import { OpConfig, RouteSenderAPI } from '@terascope/job-components';

export interface ConnectionMapping {
    [key: string]: string;
}

export interface RouteSenderConfig extends OpConfig {
    size: number;
    routing: ConnectionMapping;
    api_name: string,
    concurrency: number
}

export interface Endpoint {
    client: RouteSenderAPI;
    data: any[];
}

export type RoutingExectuion = Map <string, Endpoint>;
export type RouteDict = Map<string, Record<string, any>>;
