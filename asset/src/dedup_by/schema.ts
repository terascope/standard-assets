import { ConvictSchema } from '@terascope/job-components';
import { DedupConfig } from './interfaces';

export default class Schema extends ConvictSchema<DedupConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'field to dedup records on',
                default: undefined,
                format: 'String',
            },
            adjust_time: {
                doc: 'Adjust first and last seen',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
