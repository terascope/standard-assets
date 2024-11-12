import { ConvictSchema, isString } from '@terascope/job-components';
import { FilterByUnknownFieldsConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<FilterByUnknownFieldsConfig> {
    build() {
        return {
            known_fields: {
                doc: 'List of fields that are known to exist on the record',
                default: [],
                format: (val: unknown) => {
                    if (!Array.isArray(val)) {
                        throw new Error('Parameter "required_fields" must be an array of strings');
                    }

                    if (val.length === 0 || !val.every((i) => isString(i))) {
                        throw new Error('Parameter "required_fields" cannot be empty and must have all string values');
                    }
                }
            },
            invert: {
                doc: 'Set invert to True to return records with unknown fields',
                format: 'Boolean',
                default: false
            }
        };
    }
}
