import { BaseSchema, OpConfig } from '@terascope/job-components';

export default class Schema extends BaseSchema<OpConfig> {
    build(): Record<string, any> {
        return {};
    }
}
