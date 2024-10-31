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
                doc: 'Field to check for value to filter on',
                format: fieldCheck,
                default: null
            },
            value: {
                doc: 'Value that is compared with document field value',
                format: '*',
                default: null
            },
            invert: {
                doc: 'Set to true to keep objects that match field and value',
                format: 'Boolean',
                default: false
            },
            array_index: {
                doc: 'Specify array field index to filter on',
                format: 'Number',
                default: -1
            },
            filter_by: {
                doc: 'Filter function, options are match, regex, ip_range, validator and size',
                default: 'match',
                format: typeCheck
            },
            data_mate_function: {
                doc: 'Data-Mate validation function to apply to a field',
                default: null,
                format: validatorFuncCheck,
            },
            data_mate_args: {
                doc: 'Required Validator function args',
                default: null,
                format: '*'
            },
            drop_to_dlq: {
                doc: 'Filtered docs are sent to the kafka dead letter queue',
                default: false,
                format: 'Boolean'
            },
            regex_flags: {
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags
                doc: 'Arguments to pass to the RegExp function, default is no flags',
                default: '',
                format: 'String'
            },
            exception_rules: {
                doc: 'Array of { field, value, regex } objects that allow for specific values to bypass the validation.  Will accept a regex value but must be in format /REGEX/Flags to work',
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
    if (!isString(val) || (Array.isArray(val) && val.some((v) => !isString(v)))) {
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
        throw new Error('type must be a FieldValidator function');
    }
}
