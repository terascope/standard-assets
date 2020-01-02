import { ConvictSchema } from '@terascope/job-components';
import { GroupByConfig } from './interfaces';

export default class Schema extends ConvictSchema<GroupByConfig> {
    build() {
        return {
            field: {
                doc: 'Name of field to group each record by',
                default: undefined,
                format: 'String',
            }
        };
    }
}
