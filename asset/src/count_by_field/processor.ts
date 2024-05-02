import {
    MapProcessor, DataEntity
} from '@terascope/job-components';
import { CountByFieldConfig } from './interfaces';

export default class CountByField extends MapProcessor<CountByFieldConfig> {
    async initialize(): Promise<void> {
        if (this.opConfig.collect_metrics) {
            const name = `${this.opConfig._op}_count_total`;
            const help = `${this.opConfig._op} value field count`;
            const labelNames = ['value', 'field', 'op_name'];
            const type = 'counter';
            await this.context.apis.foundation.promMetrics.addMetric(name, help, labelNames, type);
        }
    }

    _incMetric(doc: DataEntity) {
        if (this.opConfig.collect_metrics) {
            const metricLabels = {
                value: doc[this.opConfig.field],
                field: this.opConfig.field,
                op_name: this.opConfig._op
            };
            this.context.apis.foundation.promMetrics.inc(`${this.opConfig._op}_count_total`, metricLabels, 1);
        }
        return doc;
    }

    map(doc: DataEntity): DataEntity {
        return this._incMetric(doc);
    }
}
