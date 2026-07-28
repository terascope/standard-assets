import { BaseSchema } from '@terascope/job-components';
import { isString } from '@terascope/core-utils';
import { KeepFieldConfig } from './interfaces.js';

export default class Schema extends BaseSchema<KeepFieldConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Field, or array of fields, to keep on the incoming document; all other fields are removed',
                default: null,
                format: (value: unknown) => {
                    if (value == null) {
                        throw new Error('Parameter "field" is required and must be a string or an array of strings');
                    }

                    if (Array.isArray(value)) {
                        const invalid = value.filter((field) => !isString(field));

                        if (invalid.length > 0) {
                            throw new Error(`Parameter "field" must be an array of strings, received invalid values: ${JSON.stringify(invalid)}`);
                        }

                        return;
                    }

                    if (!isString(value)) {
                        throw new Error(`Parameter "field" must be a string or an array of strings, received ${JSON.stringify(value)}`);
                    }
                }
            }
        };
    }
}
