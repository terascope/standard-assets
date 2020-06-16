import { ConvictSchema, OpConfig } from '@terascope/job-components';

export default class Schema extends ConvictSchema<OpConfig> {
    build(): Record<string, any> {
        return {};
    }
}
