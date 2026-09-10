import { isNumber, isString } from '@terascope/core-utils';
import { BaseSchema } from '@terascope/job-components';
import { FlattenObjectConfig, MissingFieldAction } from './interfaces.js';
import { WILDCARD, parsePath } from './path.js';

/**
 * Throws if the path cannot be used to address an object to flatten.
 */
function validateFieldPath(name: unknown): void {
    if (!isString(name) || name.length === 0) {
        throw new Error('Parameter "field" must only contain non-empty strings.');
    }

    const segments = parsePath(name);

    if (segments.length === 0) {
        throw new Error(`Parameter "field" value "${name}" is not a valid path.`);
    }

    if (segments[segments.length - 1] === WILDCARD) {
        throw new Error(`Parameter "field" value "${name}" cannot end with a wildcard, it must point at the object to flatten.`);
    }
}

export default class Schema extends BaseSchema<FlattenObjectConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Which fields to flatten. Leave it out to flatten the whole record, otherwise a '
                    + 'dot notation path to the object to flatten, or an array of them. A "*" segment '
                    + 'fans out across the elements of an array or the values of an object. '
                    + '(Default: null, the whole record)',
                default: null,
                format(val: unknown) {
                    if (val == null) return;

                    if (isString(val)) {
                        validateFieldPath(val);

                        return;
                    }

                    if (!Array.isArray(val) || val.length === 0) {
                        throw new Error('Parameter "field" must be a field name, a non-empty array of field names, or left out to flatten the whole record.');
                    }

                    for (const name of val) {
                        validateFieldPath(name);
                    }
                },
            },
            delimiter: {
                doc: 'Separator used to join the keys of nested objects. (Default: ".")',
                default: '.',
                format(val: unknown) {
                    if (!isString(val) || val.length === 0) {
                        throw new Error('Parameter "delimiter" must be a non-empty string.');
                    }
                },
            },
            flatten_arrays: {
                doc: 'Descend into arrays as well as objects, using the index as a key segment. '
                    + 'When false an array is copied over as a value. (Default: false)',
                default: false,
                format: 'Boolean'
            },
            max_depth: {
                doc: 'How many levels of nested objects to descend into, counted from the record '
                    + 'root when no field is set, otherwise from each listed field. Objects below '
                    + 'the limit are kept as a value. 0 means no limit. (Default: 0)',
                default: 0,
                format(val: unknown) {
                    if (!isNumber(val) || !Number.isInteger(val) || val < 0) {
                        throw new Error('Parameter "max_depth" must be an integer greater than or equal to 0.');
                    }
                },
            },
            missing_field_action: {
                doc: 'What to do when a listed field is not found on a record: "throw" the error, '
                    + '"log" a warning, or "ignore" it. Only applies when field is set. (Default: "ignore")',
                default: MissingFieldAction.ignore,
                format: Object.keys(MissingFieldAction)
            }
        };
    }
}
