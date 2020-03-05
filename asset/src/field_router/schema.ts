import { ConvictSchema } from '@terascope/job-components';
import { FieldRouterConfig } from './interfaces';

export default class Schema extends ConvictSchema<FieldRouterConfig> {
    build() {
        return {
            fields: {
                doc: 'Array fields to partition on. Must specify at least one field.',
                default: [],
                format: (fields: any) => {
                    if (!Array.isArray(fields)) {
                        throw new Error('Invalid `fields` option: must be an array.');
                    }
                    if (fields.length === 0) {
                        throw new Error('Invalid `fields` option: must include at least one field to partition on.');
                    }
                }
            },
            field_delimiter: {
                doc: 'separator between field/value combinations - default "-"',
                default: '-',
                format: 'optional_String'
            },
            value_delimiter: {
                doc: 'separator between the field name and the value - default "_"',
                default: '_',
                format: 'optional_String'
            }
        };
    }
}
