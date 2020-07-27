import { ConvictSchema } from '@terascope/job-components';
import { DateRouterConfig, DateResolution } from './interfaces';

export default class Schema extends ConvictSchema<DateRouterConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Which field in each data record contains the date to use for timeseries',
                default: null,
                format: 'required_String'
            },
            resolution: {
                doc: 'Type of timeseries data',
                default: DateResolution.daily,
                format: Object.keys(DateResolution)
            },
            field_delimiter: {
                doc: 'separator between field/value combinations - default "-"',
                default: '-',
                format: 'optional_String'
            },
            value_delimiter: {
                doc: 'separator between the field name and the value - default "_"',
                default: '_',
                format: 'optional_String'
            }
        };
    }
}
