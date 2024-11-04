import {
    MapProcessor, DataEntity, isPromAvailable
} from '@terascope/job-components';
import { CountByFieldConfig } from './interfaces.js';

type Counters = {
    [valueAsString: string]: {
        countSinceLastInc: number;
        field: string;
    };
};
export default class CountByField extends MapProcessor<CountByFieldConfig> {
    static counters: Counters = {};
    async initialize(): Promise<void> {
        const { opConfig, context } = this;

        if (opConfig.collect_metrics && isPromAvailable(context)) {
            const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();
            const name = `${this.opConfig._op}_count_total`;
            const help = `${this.opConfig._op} value field count`;
            const labelNames = [...Object.keys(defaultLabels), 'value', 'field', 'op_name'];

            await this.context.apis.foundation.promMetrics.addCounter(
                name,
                help,
                labelNames,
                function collect() {
                    for (const [valueAsString, obj] of Object.entries(CountByField.counters)) {
                        this.inc(
                            {
                                value: valueAsString,
                                field: obj.field,
                                op_name: opConfig._op,
                                ...defaultLabels
                            },
                            obj.countSinceLastInc
                        );
                        CountByField.counters[valueAsString].countSinceLastInc = 0;
                    }
                }
            );
        }
    }

    _incMetric(doc: DataEntity) {
        if (this.opConfig.collect_metrics) {
            const value = doc[this.opConfig.field];

            // prevents a number and a string representation of a number
            // to be seen as the same key. "6" !== 6
            const valueAsString: string = JSON.stringify(value);

            if (!CountByField.counters[valueAsString]) {
                CountByField.counters[valueAsString] = {
                    countSinceLastInc: 0,
                    field: this.opConfig.field
                };
            }

            CountByField.counters[valueAsString].countSinceLastInc += 1;
        }
        return doc;
    }

    map(doc: DataEntity): DataEntity {
        return this._incMetric(doc);
    }
}
