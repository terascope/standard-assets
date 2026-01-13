import { BaseSchema } from '@terascope/job-components';
import { CountByFieldConfig } from './interfaces.js';

export default class Schema extends BaseSchema<CountByFieldConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'field to count',
                default: null,
                format: 'required_string'
            },
            collect_metrics: {
                doc: 'enable metric collection',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
