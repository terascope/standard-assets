import { ConvictSchema, isString } from '@terascope/job-components';
import { CountUniqueConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<CountUniqueConfig> {
    build() {
        return {
            preserve_fields: {
                doc: 'Set of fields to preserve on the counter record.',
                default: [],
                format: (input: unknown) => {
                    if (!Array.isArray(input) || input.some((val) => !isString(val))) {
                        throw new Error('Parameter "preserve_fields" must be an array of strings')
                    }
                }
            },
            field: {
                doc: 'field to get count on',
                default: '_key',
                format: 'required_String'
            }
        };
    }
}
