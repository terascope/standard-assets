import { ConvictSchema } from '@terascope/job-components';
import { PartitionByDateConfig } from './interfaces';

export default class Schema extends ConvictSchema<PartitionByDateConfig> {
    build() {
        return {
            field: {
                doc: 'Which field in each data record contains the date to use for timeseries',
                default: 'date',
                format: 'required_String'
            },
            resolution: {
                doc: 'Type of timeseries data',
                default: 'daily',
                format: ['daily', 'monthly', 'yearly']
            },
            delimiter: {
                doc: 'Char which will be used to join by',
                default: '/',
                format: 'optional_String'
            }
        };
    }
}
