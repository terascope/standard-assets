import { ConvictSchema } from '@terascope/job-components';
import { SetFieldConditionalConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<SetFieldConditionalConfig> {
    build() {
        return {
            check_name: {
                default: '',
                doc: 'Name of the field',
                format: 'required_String',
            },
            check_values: {
                default: [],
                doc: 'Value of the field',
                format: (val: unknown) =>  {
                    if (!Array.isArray(val)) {
                        throw new Error('Parameter "check_values" must be an array')
                    }
                }
            },
            set_name: {
                default: '',
                doc: 'Name of the field',
                format: 'required_String',
            },
            set_value: {
                default: 'there is none',
                doc: 'Value of the field',
                format: '*'
            },
            create_check_field: {
                default: false,
                doc: 'Create check field if it does not exist',
                format: 'Boolean'

            }
        };
    }
}
