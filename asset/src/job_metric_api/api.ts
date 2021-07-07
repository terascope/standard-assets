import {
    OperationAPI, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import os from 'os';
import {
    Gauge, Counter, Histogram, Summary
} from 'prom-client';
import { JobMetricAPIConfig, JobMetricsApi } from './interfaces';
import createExporter from './exporter';

export default class Metrics extends OperationAPI<JobMetricAPIConfig> {
    metricList: any;
    default_labels!: Record<string, string>;
    prefix: string;

    constructor(
        workerContext: WorkerContext,
        apiConfig: JobMetricAPIConfig,
        executionConfig: ExecutionConfig

    ) {
        super(workerContext, apiConfig, executionConfig);
        this.metricList = {};
        this.default_labels = {
            ex_id: executionConfig.ex_id,
            job_id: executionConfig.job_id,
            job_name: executionConfig.name,
            name: workerContext.sysconfig.teraslice.name,
        };
        this.prefix = 'teraslice_job_';
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
     * @param  {Array<string>} labelValues [list of label values]
     * @param  {number} value [metric value]
     * @return {Promise<void>}
     */
    async set(name: string, labelValues: Array<string>, value: number): Promise<void> {
        if (this.metricList[name].functions.has('set')) {
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).set(value);
        }
    }

    /**
     * [increment metric by value]
     * @param  {string} name [metric name]
     * @param  {Array<string>} labelValues [list of label values]
     * @param  {number} value [metric value, default = 1]
     * @return {Promise<void>}
     */
    async inc(name: string, labelValues: Array<string>, value = 1): Promise<void> {
        if (this.metricList[name].functions.has('inc')) {
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).inc(value);
        }
    }

    /**
     * [decrement metric by value]
     * @param  {string} name [metric name]
     * @param  {Array<string>} labelValues [list of label values]
     * @param  {number} value [metric value, default = 1]
     * @return {Promise<void>}
     */
    async dec(name: string, labelValues: Array<string>, value = 1): Promise<void> {
        if (this.metricList[name].functions.has('dec')) {
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).dec(value);
        }
    }
    /**
     * [observe value, used by summary metric type]
     * @param  {string} name [metric name]
     * @param  {Array<string>} labelValues [list of label values]
     * @param  {number} value [metric value]
     * @return {Promise<void>}
     */
    async observe(name: string, labelValues: Array<string>, value: number): Promise<void> {
        if (this.metricList[name].functions.has('observe')) {
            this.metricList[name].metric.labels(...labelValues.concat(
                Object.values(this.default_labels)
            )).observe(value);
        }
    }

    /**
     * [add (define) new metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {string} type [metric type, gauge, counter, histogram, or summary]
     * @return {Promise<void>}
     */
    async add(name: string, help: string, labelsNames: Array<string>,
        type: string, buckets: Array<number> = [0.1, 5, 15, 50, 100, 500]): Promise<void> {
        if (!(name in this.metricList)) {
            const fullname = this.prefix + name;
            if (type === 'gauge') {
                this.metricList[name] = await this._createGaugeMetric(fullname, help,
                    labelsNames.concat(Object.keys(this.default_labels)));
            }
            if (type === 'counter') {
                this.metricList[name] = await this._createCounterMetric(fullname, help,
                    labelsNames.concat(Object.keys(this.default_labels)));
            }
            if (type === 'histogram') {
                this.metricList[name] = await this._createHistogramMetric(fullname, help,
                    labelsNames.concat(Object.keys(this.default_labels)), buckets);
            }
        }
    }
    /**
     * [addSummary (define) new summary metric]
     * @param  {string} name [metric name]
     * @param  {string} help [metric help]
     * @param  {Array<string>} labelsNames [list of label names]
     * @param  {Array<number>} percentiles [metric percentiles, default[0.01, 0.1, 0.9, 0.99] ]
     * @param  {number} maxAgeSeconds [how old a bucket can be before it is reset ]
     * @param  {number} ageBuckets [how many buckets for sliding window ]
     * @return {Promise<void>}
     */
    async addSummary(name: string,
        help: string,
        labelsNames: Array<string>,
        maxAgeSeconds = 600,
        ageBuckets = 5,
        percentiles: Array<number> = [0.01, 0.1, 0.9, 0.99]): Promise<void> {
        if (!(name in this.metricList)) {
            const fullname = this.prefix + name;
            this.metricList[name] = await this._createSummaryMetric(fullname, help,
                labelsNames.concat(Object.keys(this.default_labels)),
                percentiles, maxAgeSeconds, ageBuckets,);
        }
    }
    private async _createGaugeMetric(name: string, help: string,
        labelsNames: Array<string>): Promise<any> {
        const gauge = new Gauge({
            name,
            help,
            labelNames: labelsNames,
        });
        return { name, metric: gauge, functions: new Set(['inc', 'dec', 'set']) };
    }
    private async _createCounterMetric(name: string, help: string,
        labelsNames: Array<string>): Promise<any> {
        const counter = new Counter({
            name,
            help,
            labelNames: labelsNames,
        });
        return { name, metric: counter, functions: new Set(['inc', 'dec']) };
    }
    private async _createHistogramMetric(name: string, help: string, labelsNames: Array<string>,
        buckets: Array<number>): Promise<any> {
        const histogram = new Histogram({
            name,
            help,
            labelNames: labelsNames,
            buckets
        });
        return { name, metric: histogram, functions: new Set(['observe']) };
    }

    private async _createSummaryMetric(name: string, help: string, labelsNames: Array<string>,
        percentiles: Array<number>, ageBuckets: number, maxAgeSeconds: number): Promise<any> {
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

    async createAPI(): Promise<JobMetricsApi> {
        try {
            await createExporter(this.apiConfig);
        } catch (error) {
            this.logger.info('job_metric_api exporter already running');
            this.logger.error(error);
        }
        return {
            set: this.set.bind(this),
            add: this.add.bind(this),
            addSummary: this.addSummary.bind(this),
            inc: this.inc.bind(this),
            dec: this.dec.bind(this),
            observe: this.observe.bind(this)
        };
    }
}
