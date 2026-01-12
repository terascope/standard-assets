import { BaseSchema } from '@terascope/job-components';
import { DateRouterConfig } from '@terascope/standard-asset-apis';

export default class Schema extends BaseSchema<DateRouterConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Name of new field',
                default: null,
                format: 'required_string'
            },
            value: {
                doc: 'Value of new field',
                default: null,
                format: (value: unknown) => {
                    if (value == null) {
                        throw new Error(`${value} cannot be null`);
                    }
                }
            },
            overwrite: {
                doc: 'Sets the field even if it is already on the document',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
