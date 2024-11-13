import { ConvictSchema, isString, isISO8601 } from '@terascope/job-components';
import ms from 'ms';
import { FilterByDateConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<FilterByDateConfig> {
    _limitsSchema(val: unknown) {
        if (!isString(val)) {
            throw new Error('Limits must be a string');
        }

        if (isISO8601(val)) {
            return new Date(val).getTime();
        }

        const result = ms(val);
        if (result == null) {
            throw new Error(`Invalid date like value, got ${val}`);
        }

        return result;
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
