import {
    APIConfig
} from '@terascope/job-components';

export interface JobMetricAPIConfig extends APIConfig {
    port: number
    default_metrics: boolean
}

export interface MetricList {
    readonly name?: string | undefined,
    readonly metric?: unknown | undefined,
    readonly functions?: Set<string> | undefined
}

export interface JobMetricsAPI {
    set: (name: string, labels: Record<string, string>, value: number) => void;
    inc: (name: string, labelValues: Record<string, string>, value: number) => void;
    dec: (name: string, labelValues: Record<string, string>, value: number) => void;
    observe: (name: string, labelValues: Record<string, string>, value: number) => void;
    addMetric: (name: 'gauge' | 'counter' | 'histogram', help: string, labelNames: Array<string>, type: string,
        buckets: Array<number>) => Promise<void>;
    addSummary: (name: string, help: string, labelNames: Array<string>,
        ageBuckets: number, maxAgeSeconds: number,
        percentiles: Array<number>) => void;
    hasMetric: (name: string) => boolean;
    deleteMetric: (name: string) => boolean;
}
