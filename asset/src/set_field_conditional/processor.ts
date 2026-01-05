import { DataEntity, set } from '@terascope/core-utils';
import {
    MapProcessor, Context, ExecutionConfig,
} from '@terascope/job-components';
import { SetFieldConditionalConfig } from './interfaces.js';

export default class SetFieldConditional extends MapProcessor<SetFieldConditionalConfig> {
    valuesMap = new Map();

    constructor(context: Context, opConfig: SetFieldConditionalConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        for (const value of opConfig.conditional_values) {
            this.valuesMap.set(value, value);
        }
    }

    map(data: DataEntity) {
        if (this.valuesMap.has(data[this.opConfig.conditional_field])) {
            set(data, this.opConfig.set_field, this.opConfig.value);
        }

        return data;
    }
}
