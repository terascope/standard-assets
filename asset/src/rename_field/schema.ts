import { isPlainObject, isString } from '@terascope/core-utils';
import { BaseSchema } from '@terascope/job-components';
import { RenameFieldConfig } from './interfaces.js';

export default class Schema extends BaseSchema<RenameFieldConfig> {
    build(): Record<string, any> {
        return {
            mapping: {
                doc: 'Object mapping an existing field name to the new field name it should be renamed to, '
                    + 'e.g. { "LATITUDE": "latitude" }. The original field is removed.',
                default: null,
                format: (value: unknown) => {
                    if (!isPlainObject(value)) {
                        throw new Error(`Parameter "mapping" must be an object of { oldField: newField } string pairs, received ${value}`);
                    }

                    const entries = Object.entries(value as Record<string, unknown>);

                    if (entries.length === 0) {
                        throw new Error('Parameter "mapping" cannot be empty');
                    }

                    if (!entries.every(([key, val]) => isString(key) && isString(val))) {
                        throw new Error('Parameter "mapping" must have all string keys and values');
                    }
                }
            }
        };
    }
}
