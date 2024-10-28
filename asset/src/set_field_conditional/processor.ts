import {
    MapProcessor, Context, DataEntity,
    ExecutionConfig, set,
} from '@terascope/job-components';
import { SetFieldConditionalConfig } from './interfaces.js';

export default class SetFieldConditional extends MapProcessor<SetFieldConditionalConfig> {
    valuesMap = new Map();

    constructor(context: Context, opConfig: SetFieldConditionalConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        for (const value of opConfig.check_values) {
            this.valuesMap.set(value, value);
        }
    }

    map(data: DataEntity) {
        if (this.opConfig.create_check_field && !(this.opConfig.check_name in data)) {
            set(data, this.opConfig.check_name, null);
        }

        if (this.valuesMap.has(data[this.opConfig.check_name])) {
            set(data, this.opConfig.set_name, this.opConfig.set_value);
        }

        return data;
    }
}
