import { ConvictSchema, isPlainObject, isString } from '@terascope/job-components';
import * as I from './interfaces';

export default class Schema extends ConvictSchema<I.DedupeConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'field to dedupe records on',
                default: undefined,
                format: 'optional_String',
            },
            adjust_time: {
                doc: 'Requires and array of objects with field and preference properties.  Preference should be oldest or newest.',
                default: [],
                format: (value: []) => validateTime(value)
            }
        };
    }
}

function validateTime(value: I.AdjustTime[]) {
    value.forEach((time) => {
        if (!isPlainObject(time)) throw new Error('Invalid parameter adjust_time, expected an array of objects');
        const { field, preference } = time;

        if (!field || !preference) {
            throw new Error('Both the time field and the preference must be present');
        }

        if (preference !== 'oldest' && preference !== 'newest') {
            throw new Error('Invalid adjust_time config, it must have key "preference" set to "oldest" or "newest"');
        }

        if (!isString(field)) throw new Error('Invalid adjust_time config, "field" must be specified and must be a string');
    });
}
