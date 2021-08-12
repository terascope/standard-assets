import { ConvictSchema } from '@terascope/job-components';
import { DateRouterConfig, DateResolution } from './interfaces';

export default class Schema extends ConvictSchema<DateRouterConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Which field in each data record contains the date to use for time series',
                default: null,
                format: 'required_String'
            },
            resolution: {
                doc: 'Type of time series data: yearly, monthly, weekly, weekly_epoch, or daily.  Weekly_epoch is weeks since start of epoch time, Jan 1, 1970.',
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
            },
            include_date_units: {
                doc: 'determines if the date unit (year, month, day) should be included in final output',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
