import { DataArray } from './interfaces';

const { BatchProcessor } = require('@terascope/job-components');

class JobMetricExample extends BatchProcessor {
    _initialized = false;
    constructor(...args: any) {
        super(...args);
        this.opName = 'job_metric_example';
    }

    async initialize(): Promise<void> {
        this._initialized = true;
        // setup metric api
        if (this.opConfig.collect_metrics && !this.metrics) {
            this.metrics = await this.createAPI(this.opConfig.metric_api_name);
            // add metric(s)
            // parameters
            // this.metrics.add(metric name , help description, array of labels, metric type
            // (gauge or counter ;
            await this.metrics.addMetric(`${this.opName}_cache_hits_total`, `${this.opName} state storage cache hits`, ['units', 'op_name'], 'counter');
            await this.metrics.addMetric(`${this.opName}_cache_misses_total`, `${this.opName} state storage cache misses`, ['units', 'op_name'], 'gauge');
            await this.metrics.addMetric(`${this.opName}_cache_duration_seconds`, `${this.opName} state storage cache duration seconds`, ['op_name'], 'histogram');
            await this.metrics.addSummary(`${this.opName}_cache_summary`, `${this.opName} state storage cache summary`, ['op_name'], 'summary');
            await this.metrics.addMetric(`${this.opName}_test_delete`, `${this.opName} test delete`, ['op_name'], 'counter');
            await this.metrics.deleteMetric(`${this.opName}_test_delete`);
        }
    }

    async onBatch(docs: {string: DataArray[]}): Promise<any> {
        if (this.opConfig.collect_metrics) {
            await this.metrics.inc(`${this.opName}_cache_hits_total`, { 'units:': 'hits', op_name: this.opName }, 2);
            await this.metrics.inc(`${this.opName}_cache_hits_total`, { 'units:': 'hits', op_name: this.opName });
            await this.metrics.set(`${this.opName}_cache_misses_total`, { 'units:': 'hits', op_name: this.opName }, 10);
            await this.metrics.inc(`${this.opName}_cache_misses_total`, { 'units:': 'hits', op_name: this.opName }, 1);
            await this.metrics.dec(`${this.opName}_cache_misses_total`, { 'units:': 'hits', op_name: this.opName }, 1);
            await this.metrics.observe(`${this.opName}_cache_duration_seconds`, { op_name: this.opName }, 100);
            await this.metrics.observe(`${this.opName}_cache_summary`, { op_name: this.opName }, 100);
        }
        return docs;
    }
}

module.exports = JobMetricExample;
