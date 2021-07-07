import {
    APIConfig
} from '@terascope/job-components';

export interface JobMetricAPIConfig extends APIConfig {
    port: number
    default_metrics: boolean
}

export interface JobMetricsApi {
    set: (name: string, labelValues: Array<string>, value: number) => Promise<void>;
    inc: (name: string, labelValues: Array<string>, value: number) => Promise<void>;
    dec: (name: string, labelValues: Array<string>, value: number) => Promise<void>;
    observe: (name: string, labelValues: Array<string>, value: number) => Promise<void>;
    add: (name: string, help: string, labelNames: Array<string>, type: string,
        buckets: Array<number>) => Promise<void>;
    addSummary: (name: string, help: string, labelNames: Array<string>,
        ageBuckets: number, maxAgeSeconds: number,
        percentiles: Array<number>) => Promise<void>;
}
