import { BaseSchema, OpConfig } from '@terascope/job-components';

export default class Schema extends BaseSchema<OpConfig> {
    build(): Record<string, any> {
        return {
            type: {
                doc: 'type of data window',
                default: null,
                format: 'optional_string'
            },
        };
    }
}
