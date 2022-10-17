import { ConvictSchema, OpConfig } from '@terascope/job-components';
import { isInteger, inNumberRange } from '@terascope/utils';

export default class Schema extends ConvictSchema<OpConfig> {
    build(): Record<string, any> {
        return {
            length: {
                doc: 'length of UUID',
                default: 10,
                format: (value: number) => {
                    if (!isInteger(value)
                        || !inNumberRange(value, { min: 2, max: 16, inclusive: true })) {
                        throw new Error('number must be an integer between 2 and 16');
                    }
                }
            },
            field: {
                doc: 'Name of field to add the id to',
                default: null,
                format: 'required_String'
            },
            dictionary: {
                doc: 'Character types to use in the ID',
                default: 'alphanum',
                format: (value: string) => {
                    const acceptedValues = [
                        'number',
                        'alpha',
                        'alpha_lower',
                        'alpha_upper',
                        'alphanum',
                        'alphanum_lower',
                        'alphanum_upper',
                        'hex'
                    ];

                    if (!acceptedValues.includes(value)) {
                        throw new Error(`dictionary value must be one of ${acceptedValues}.  Input was ${value}`);
                    }
                }
            }
        };
    }
}
