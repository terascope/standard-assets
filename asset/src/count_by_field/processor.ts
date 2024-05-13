import {
    MapProcessor, DataEntity
} from '@terascope/job-components';
import { CountByFieldConfig } from './interfaces';

type Counters = {
    [valueAsString: string]: {
        countSinceLastInc: number;
    };
}
export default class CountByField extends MapProcessor<CountByFieldConfig> {
    counters: Counters = {};
    async initialize(): Promise<void> {
        const { opConfig, counters } = this;
        if (opConfig.collect_metrics) {
            const name = `${this.opConfig._op}_count_total`;
            const help = `${this.opConfig._op} value field count`;
            const labelNames = ['value', 'value_type', 'field', 'op_name'];
            await this.context.apis.foundation.promMetrics.addCounter(
                name,
                help,
                labelNames,
                function collect() {
                    for (const [valueAsString, countObj] of Object.entries(counters)) {
                        this.inc(
                            {
                                value: valueAsString,
                                field: opConfig.field,
                                op_name: opConfig._op
                            },
                            countObj.countSinceLastInc
                        );
                        counters[valueAsString].countSinceLastInc = 0;
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

            if (!this.counters[valueAsString]) {
                this.counters[valueAsString] = {
                    countSinceLastInc: 0
                };
            }

            this.counters[valueAsString].countSinceLastInc += 1;
        }
        return doc;
    }

    map(doc: DataEntity): DataEntity {
        return this._incMetric(doc);
    }
}
