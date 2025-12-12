import { ConvictSchema } from '@terascope/job-components';
import { SetFieldConditionalConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<SetFieldConditionalConfig> {
    build() {
        return {
            conditional_field: {
                default: '',
                doc: 'Name of the field',
                format: 'required_string',
            },
            conditional_values: {
                default: [],
                doc: 'Value of the field',
                format: (val: unknown) => {
                    if (!Array.isArray(val)) {
                        throw new Error('Parameter "conditional_values" must be an array');
                    }
                }
            },
            set_field: {
                default: '',
                doc: 'Name of the field',
                format: 'required_string',
            },
            value: {
                default: null,
                doc: 'Value of the field',
                format: '*'
            }
        };
    }
}
