import { ConvictSchema } from '@terascope/job-components';
import { GroupByConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<GroupByConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Name of field to group each record by',
                default: undefined,
                format: 'optional_String',
            }
        };
    }
}
