import { ConvictSchema, isString } from '@terascope/job-components';
import { FilterByRequiredFieldConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<FilterByRequiredFieldConfig> {
    build() {
        return {
            required_fields: {
                doc: 'Array of fields that must be present',
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
            filter_type: {
                doc: 'AND or OR, if AND then every field is required, if OR just one of the fields',
                default: 'AND',
                format: (value: unknown) => {
                    if (!isString(value)) {
                        throw new Error('Parameter "filter_type" must be a string');
                    }

                    const lowerCase = value.toLowerCase();

                    if (lowerCase !== 'or' && lowerCase !== 'and') {
                        throw new Error('value must be "OR" or "AND"');
                    }
                }
            },
            invert: {
                doc: 'invert selection, keep docs with fields',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
