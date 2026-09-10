import { isNumber, isString } from '@terascope/core-utils';
import { BaseSchema } from '@terascope/job-components';
import { FlattenObjectConfig, MissingFieldAction } from './interfaces.js';
import { WILDCARD, parsePath } from './processor.js';

/**
 * Throws if the path cannot be used to address an object to flatten.
 */
function validateFieldPath(name: unknown): void {
    if (!isString(name) || name.length === 0) {
        throw new Error('field must only contain non-empty strings.');
    }

    const segments = parsePath(name);

    if (segments.length === 0) {
        throw new Error(`field "${name}" is not a valid path.`);
    }

    if (segments[segments.length - 1] === WILDCARD) {
        throw new Error(`field "${name}" cannot end with a wildcard, it must point at the object to flatten.`);
    }
}

export default class Schema extends BaseSchema<FlattenObjectConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Which fields to flatten. "all" (or ["all"]) flattens the whole record, otherwise '
                    + 'a dot notation path to the object to flatten, or an array of them. A "*" segment '
                    + 'fans out across the elements of an array or the values of an object. (Default: "all")',
                default: 'all',
                format(val: unknown) {
                    if (isString(val)) {
                        if (val !== 'all') validateFieldPath(val);

                        return;
                    }

                    if (!Array.isArray(val) || val.length === 0) {
                        throw new Error('field must be a field name, "all", or a non-empty array of field names.');
                    }

                    for (const name of val) {
                        if (name !== 'all') validateFieldPath(name);
                    }
                },
            },
            delimiter: {
                doc: 'separator used to join the keys of nested objects - default "."',
                default: '.',
                format: 'optional_string'
            },
            flatten_arrays: {
                doc: 'Descend into arrays as well as objects, using the index as a key segment. '
                    + 'When false an array is copied over as a value. (Default: false)',
                default: false,
                format: 'Boolean'
            },
            max_depth: {
                doc: 'How many levels of nested objects to descend into, counted from the record '
                    + 'root when field is "all", otherwise from each listed field. Objects below '
                    + 'the limit are kept as a value. 0 means no limit. (Default: 0)',
                default: 0,
                format(val: unknown) {
                    if (!isNumber(val) || !Number.isInteger(val) || val < 0) {
                        throw new Error('max_depth must be an integer greater than or equal to 0.');
                    }
                },
            },
            missing_field_action: {
                doc: 'What to do when a listed field is not found on a record: "throw" the error, '
                    + '"log" a warning, or "ignore" it. Only applies when field is not "all". (Default: "ignore")',
                default: MissingFieldAction.ignore,
                format: Object.keys(MissingFieldAction)
            }
        };
    }
}
