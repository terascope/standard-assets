import { ConvictSchema, isString } from '@terascope/job-components';
import { CountUniqueConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<CountUniqueConfig> {
    build() {
        return {
            preserve_fields: {
                doc: 'A list of fields whose last seen values are added to the result in addition to the count',
                default: [],
                format: (input: unknown) => {
                    if (!Array.isArray(input) || input.some((val) => !isString(val))) {
                        throw new Error('Parameter "preserve_fields" must be an array of strings');
                    }
                }
            },
            field: {
                doc: 'Field that is counted, defaults to metadata _key',
                default: '_key',
                format: 'required_string'
            },
            is_meta_field: {
                doc: 'determines if the field to count on lives as a DataEntity meta field or on the record itself',
                default: true,
                format: Boolean
            }
        };
    }
}
