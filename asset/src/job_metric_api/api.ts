import {
    OperationAPI, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import os from 'os';
import {
    Gauge, Counter, Histogram, Summary
} from 'prom-client';

import { JobMetricAPIConfig, JobMetricsAPI, MetricList } from './interfaces';

import {
    createExporter, shutdownExporter, deleteMetricFromExporter, CloseExporter
} from './exporter';

export default class Metrics extends OperationAPI<JobMetricAPIConfig> {
    readonly metricList!: MetricList;

    default_labels!: Record<string, string>;
    prefix: string;
    private metricExporter!: CloseExporter;

    constructor(
        workerContext: WorkerContext,
        apiConfig: JobMetricAPIConfig,
        executionConfig: ExecutionConfig

    ) {
        super(workerContext, apiConfig, executionConfig);
        this.default_labels = {
            ex_id: executionConfig.ex_id,
            job_id: executionConfig.job_id,
            job_name: executionConfig.name,
            name: workerContext.sysconfig.teraslice.name,
        };
        // Prefix hard coded standardize the way these metrics appear in prometheus
        this.prefix = 'teraslice_job_';
        this.metricList = {};
        this.setPodName();
    }

    setPodName(): void {
        // in a pod the hostname is the pod name
        const host = os.hostname();
        if (host.startsWith('ts-wkr-')) {
            this.default_labels.pod_name = host;
        }
    }

    /**
     * [set metric to value]
     * @param  {string} name [metric name]
     * @param  {Record<string, string>} labels [list of labels and labels values]
     * @param  {number} value [metric value]
     * @return {void}
     */
    set(name: string, labels: Record<string, string>, value: number): void {
        if (this.metricList[name].functions.has('set')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).set(value);
        } else {
            throw new Error(`set not available on ${name} metric`);
        }
    }

    /**
     * [increment metric by value]
     * @param  {string} name [metric name]
     * @param  {Record<string, string>} labels [list of labels and labels values]
     * @param  {number} value [metric value, default = 1]
     * @return {void}
     */
    inc(name: string, labels: Record<string, string>, value = 1): void {
        if (this.metricList[name].functions.has('inc')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).inc(value);
        } else {
            throw new Error(`inc not available on ${name} metric`);
        }
    }

    /**
     * [decrement metric by value]
     * @param  {string} name [metric name]
     * @param  {Record<string, string>} labels [list of labels and labels values]
     * @param  {number} value [metric value, default = 1]
     * @return {void}
     */
    dec(name: string, labels: Record<string, string>, value = 1): void {
        if (this.metricList[name].functions.has('dec')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).dec(value);
        } else {
            throw new Error(`dec not available on ${name} metric`);
        }
    }
    /**
     * [observe value, used by summary metric type]
     * @param  {string} name [metric name]
     * @param  {Record<string, string>} labels [list of labels and labels values]
     * @param  {Array<string>} labelValues [list of label values]
     * @param  {number} value [metric value]
     * @return {void}
     */
    observe(name: string, labels: Record<string, string>, value: number): void {
        if (this.metricList[name].functions.has('observe')) {
            const labelValues = Object.keys(labels).map((key) => labels[key]);
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).observe(value);
        } else {
            throw new Error(`observe not available on ${name} metric`);
        }
    }

    /**
     * [addMetric (define) new metric]
     * @param  {'gauge' | 'counter' | 'histogram'} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {string} type [metric type, gauge, counter, histogram, or summary]
     * @return {void}
     */
    async addMetric(name: 'gauge' | 'counter' | 'histogram', help: string, labelsNames: Array<string>,
        type: string, buckets: Array<number> = [0.1, 5, 15, 50, 100, 500]): Promise<void> {
        if (!(this.hasMetric(name))) {
            const fullname = this.prefix + name;
            if (type === 'gauge') {
                this.metricList[name] = this._createGaugeMetric(fullname, help,
                    labelsNames.concat(Object.keys(this.default_labels)));
            }
            if (type === 'counter') {
                this.metricList[name] = this._createCounterMetric(fullname, help,
                    labelsNames.concat(Object.keys(this.default_labels)));
            }
            if (type === 'histogram') {
                this.metricList[name] = this._createHistogramMetric(fullname, help,
                    labelsNames.concat(Object.keys(this.default_labels)), buckets);
            }
        } else {
            throw new Error(`metric ${name} already defined in metric list`);
        }
    }

    /**
     * [hasMetric check if metricList contains metric]
     * @param  {string} name [metric name]
     * @return {boolean}
     */

    hasMetric(name: string): boolean {
        return (name in this.metricList);
    }

    /**
     * [deleteMetric delete metric from metricList]
     * @param  {string} name [metric name]
     * @return {boolean}
     */
    deleteMetric(name: string): boolean {
        let deleted = false;
        const fullname = this.prefix + name;
        this.logger.info(`delete metric ${fullname}`);
        if (this.hasMetric(name)) {
            deleted = delete this.metricList[name];
            try {
                deleteMetricFromExporter(fullname);
            } catch (err) {
                deleted = false;
                throw new Error(`unable to delete metric ${fullname} from exporter`);
            }
        } else {
            throw new Error(`metric ${name} not defined in metric list`);
        }
        return deleted;
    }

    /**
     * [addSummary (define) new summary metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {Array<number>} percentiles [metric percentiles, default[0.01, 0.1, 0.9, 0.99] ]
     * @param  {number} maxAgeSeconds [how old a bucket can be before it is reset ]
     * @param  {number} ageBuckets [how many buckets for sliding window ]
     * @return {void}
     */
    addSummary(name: string,
        help: string,
        labelsNames: Array<string>,
        maxAgeSeconds = 600,
        ageBuckets = 5,
        percentiles: Array<number> = [0.01, 0.1, 0.9, 0.99]): void {
        if (!(name in this.metricList)) {
            const fullname = this.prefix + name;
            this.metricList[name] = this._createSummaryMetric(fullname, help,
                labelsNames.concat(Object.keys(this.default_labels)),
                percentiles, maxAgeSeconds, ageBuckets,);
        }
    }
    private _createGaugeMetric(name: string, help: string,
        labelsNames: Array<string>): any {
        const gauge = new Gauge({
            name,
            help,
            labelNames: labelsNames,
        });
        return { name, metric: gauge, functions: new Set(['inc', 'dec', 'set']) };
    }
    private _createCounterMetric(name: string, help: string,
        labelsNames: Array<string>): any {
        const counter = new Counter({
            name,
            help,
            labelNames: labelsNames,
        });
        return { name, metric: counter, functions: new Set(['inc', 'dec']) };
    }
    private _createHistogramMetric(name: string, help: string, labelsNames: Array<string>,
        buckets: Array<number>): any {
        const histogram = new Histogram({
            name,
            help,
            labelNames: labelsNames,
            buckets
        });
        return { name, metric: histogram, functions: new Set(['observe']) };
    }

    private _createSummaryMetric(name: string, help: string, labelsNames: Array<string>,
        percentiles: Array<number>, ageBuckets: number, maxAgeSeconds: number): any {
        const histogram = new Summary({
            name,
            help,
            labelNames: labelsNames,
            percentiles,
            maxAgeSeconds,
            ageBuckets
        });
        return { name, metric: histogram, functions: new Set(['observe']) };
    }

    async createAPI(): Promise<JobMetricsAPI> {
        try {
            if (!this.metricExporter) {
                this.metricExporter = await createExporter(this.apiConfig);
            }
        } catch (err) {
            this.logger.info('job_metric_api exporter already running');
            this.logger.error(err);
        }
        return {
            set: this.set.bind(this),
            addMetric: this.addMetric.bind(this),
            hasMetric: this.hasMetric.bind(this),
            deleteMetric: this.deleteMetric.bind(this),
            addSummary: this.addSummary.bind(this),
            inc: this.inc.bind(this),
            dec: this.dec.bind(this),
            observe: this.observe.bind(this),
        };
    }

    async shutdown(): Promise<void> {
        this.logger.info('job_metric_api exporter shutdown');
        try {
            await shutdownExporter(this.metricExporter);
        } catch (err) {
            this.logger.error(err);
        }
    }
}
