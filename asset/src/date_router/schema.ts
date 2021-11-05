import { ConvictSchema } from '@terascope/job-components';
import { DateRouterConfig, DateResolution, validDateDelimiters } from '@terascope/standard-asset-apis';

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
            date_delimiter: {
                doc: 'separator between the date parts, ie year, month, date',
                default: '.',
                format: (value: string) => this.validateDelimiter(value)
            },
            date_unit_delimiter: {
                doc: 'separator between the date unit and the date value, only used if include_date_units is true.  Defaults to "_"',
                default: '_',
                format: (value: string) => this.validateDelimiter(value)
            },
            include_date_units: {
                doc: 'determines if the date unit (year, month, day) should be included in final output',
                default: false,
                format: 'Boolean'
            }
        };
    }

    validateDelimiter(value: string): void {
        if (!validDateDelimiters.has(value)) {
            throw Error(`Delimiter must be one of ${[...validDateDelimiters].join(',')}, value was ${value}`);
        }
    }
}
