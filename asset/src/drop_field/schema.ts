import { ConvictSchema } from '@terascope/job-components';
import { FieldValidator } from '@terascope/data-mate';
import { DateRouterConfig } from '@terascope/standard-asset-apis';

export default class Schema extends ConvictSchema<DateRouterConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Field to remove from incoming document',
                default: null,
                format: 'required_String'
            },
            drop_method: {
                doc: 'Method name to use to determine if field should be removed from document',
                default: 'every',
                format: (value: string) => {
                    const values = ['every', 'regex'];

                    const validValues = values.concat(Object.keys(FieldValidator));

                    if (!validValues.includes(value)) {
                        throw new Error(`drop_method must be one of ${validValues.join(' or ')}`);
                    }
                }
            },
            method_args: {
                doc: 'Args for regex and validation method',
                default: null,
                format: '*'
            }
        };
    }
}
