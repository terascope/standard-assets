import { ConvictSchema, isString, isISO8601 } from '@terascope/job-components';
import { FilterByDateConfig } from './interfaces.js';

// TODO: should we be using the "ms" library?
const acceptableUnits = [
    'minute',
    'minutes',
    'm',
    'hour',
    'hours',
    'h',
    'day',
    'days',
    'd',
    'week',
    'weeks',
    'w',
    'month',
    'months',
    'M',
    'year',
    'years',
    'Y'
];

export default class Schema extends ConvictSchema<FilterByDateConfig> {
    _limitsSchema(val: unknown) {
        if (!isString(val)) {
            throw new Error('Limits must be a string');
        }

        if (isISO8601(val)) {
            return;
        }

        const param = val as string;
        let number: any;
        // TODO: This checking is very bad
        try {
            // @ts-expect-error
            ([number] = param.match(/^[\d]+(\.[\d]+)?/));
        } catch (err) {
            throw new Error('Limits must start with a positive number');
        }

        if (!(number >= 0 && number <= 100000)) {
            throw new Error('Limits must be between 0 and 100000');
        }

        const unit = param.slice(number.length);

        if (acceptableUnits.indexOf(unit) < 0) {
            throw new Error('Acceptable units are minute(s) or m, hour(s) or h, day(s) or d, week(s) or w, month(s) or M, year(s) or Y');
        }
    }

    build() {
        return {
            date_field: {
                doc: 'date field',
                format: 'required_String',
                default: 'date'
            },
            limit_past: {
                // date string or 1week syntax, maybe use ms library
                doc: 'limit on dates before',
                format: this._limitsSchema,
                default: '1week'
            },
            limit_future: {
                doc: 'limit on dates after',
                format: this._limitsSchema,
                default: '1day'
            }
        };
    }
}
