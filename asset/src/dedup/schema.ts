import { ConvictSchema } from '@terascope/job-components';
import * as I from './interfaces';

export default class Schema extends ConvictSchema<I.DedupConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'field to dedup records on',
                default: undefined,
                format: 'String',
            },
            adjust_time: {
                doc: 'Requires and array of objects with field and preference properties.  Preference should be oldest of newest.',
                default: [],
                format: (value: []) => validateTime(value)
            }
        };
    }
}

function validateTime(value: I.AdjustTime[]) {
    value.forEach((time) => {
        const { field, preference } = time;

        if (!field || !preference) {
            throw new Error('Both the time field and the preference must be present');
        }

        if (preference !== 'oldest' && preference !== 'newest') {
            throw new Error('Preference must be oldest or newest');
        }
    });
}
