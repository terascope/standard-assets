import {
    ConvictSchema, isString, isBoolean, has
} from '@terascope/job-components';
import { FieldValidator } from '@terascope/data-mate';
import { FilterConfig } from './interfaces.js';

// TODO: add more checks around grouping, if one set but not another that is paired
export default class Schema extends ConvictSchema<FilterConfig> {
    build() {
        return {
            field: {
                doc: 'Field to filter on',
                format: fieldCheck,
                default: null
            },
            value: {
                doc: 'Value that is compared with document field value',
                format: '*',
                default: null
            },
            invert: {
                doc: 'Set to true to return documents that match filter rules',
                format: 'Boolean',
                default: false
            },
            array_index: {
                doc: 'Specify array field index to filter on',
                format: 'Number',
                default: -1
            },
            filter_by: {
                doc: 'Filter function options are: match, regex, ip_range, validator or size',
                default: 'match',
                format: typeCheck
            },
            validation_function: {
                doc: 'DataMate validation function to apply to a field',
                default: null,
                format: validatorFuncCheck,
            },
            validation_function_args: {
                doc: 'Required Validator function args',
                default: null,
                format: '*'
            },
            filtered_to_dead_letter_queue: {
                doc: 'Filtered docs are sent to the kafka dead letter queue',
                default: false,
                format: (val: unknown) => {
                    if (!isBoolean(val)) {
                        throw new Error('Paramter "drop_to_dlq" should be a boolean');
                    }
                }
            },
            exception_rules: {
                doc: 'Expects an array of objects, ie: [{ field: FIELD NAME, value: STRING or REGEX, regex: BOOLEAN }]. The value property can be a string or a regex, but if it is a regex it must be in format /REGEX/Flags and the regex property should be set to true.',
                default: null,
                format: (rules: unknown) => {
                    if (rules == null) return;
                    if (!Array.isArray(rules)) {
                        throw new Error(`exception must be an array of objects, got ${rules}`);
                    }

                    for (const rule of rules) {
                        const { field, value, regex } = rule;

                        if (!isString(field)
                            || value == null
                            || (regex != null
                                && !isBoolean(regex)
                                && !isString(value))) {
                            throw new Error(`exception properties must be either "field" with a string value or "value" with a non-null value, got ${rules}`);
                        }
                    }
                }
            }
        };
    }
}

function fieldCheck(val: unknown) {
    if (Array.isArray(val)) {
        if (val.some((v) => !isString(v))) {
            throw new Error(`Field must be a string or array of strings, received ${val}`);
        }
        return;
    } else if (!isString(val)) {
        throw new Error(`Field must be a string or array of strings, received ${val}`);
    }
}

function typeCheck(val: unknown) {
    const filterChoices = ['match', 'regex', 'ip_range', 'validator', 'size'];

    if (val == null || !isString(val) || !filterChoices.includes(val)) {
        throw new Error('type must be match, regex, ip_range, validator, or size');
    }
}

function validatorFuncCheck(val: unknown) {
    if (val == null) return;

    if (!isString(val) || !has(FieldValidator, val)) {
        throw new Error(`Parameter validation_function was set to "${val}", must be a valid FieldValidator function`);
    }
}
