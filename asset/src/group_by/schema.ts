import { BaseSchema } from '@terascope/job-components';
import { GroupByConfig } from './interfaces.js';

export default class Schema extends BaseSchema<GroupByConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Name of field to group each record by',
                default: undefined,
                format: 'optional_string',
            }
        };
    }
}
