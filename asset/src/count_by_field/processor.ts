import {
    MapProcessor, DataEntity, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import { CountByFieldConfig } from './interfaces';
import { JobMetricsAPI } from '../job_metric_api/interfaces';

export default class CountByField extends MapProcessor<CountByFieldConfig> {
    private metrics!: JobMetricsAPI;
    private opName!: string;
    static metrics: any;
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(context: WorkerContext, opConfig: CountByFieldConfig,
        exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.opName = 'count_by_field';
        this.initialize();
    }

    async initialize(): Promise<void> {
        if (this.opConfig.collect_metrics) {
            this.metrics = await this.createAPI(this.opConfig.metric_api_name);
            const name = `${this.opName}_count_total`;
            const help = `${this.opName} value field count`;
            const labelNames = ['value', 'field', 'op_name'];
            const type = 'counter';
            await this.metrics.addMetric(name, help, labelNames, type);
        }
    }

    _addMetric(doc: DataEntity) {
        if (this.opConfig.collect_metrics) {
            const metricLabels = {
                value: doc[this.opConfig.field],
                field: this.opConfig.field,
                op_name: this.opName
            };
            this.metrics.inc(`${this.opName}_count_total`, metricLabels, 1);
        }
        return doc;
    }

    map(doc: DataEntity): DataEntity {
        return this._addMetric(doc);
    }
}
