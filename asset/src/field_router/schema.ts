import { BaseSchema, OpConfig } from '@terascope/job-components';
import { FieldRouterConfig } from '@terascope/standard-asset-apis';

export default class Schema extends BaseSchema<FieldRouterConfig & OpConfig> {
    build(): Record<string, any> {
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
                format: 'optional_string'
            },
            value_delimiter: {
                doc: 'separator between the field name and the value - default "_"',
                default: '_',
                format: 'optional_string'
            },
            include_field_names: {
                doc: 'determines if the field name should be included in final output',
                default: true,
                format: 'Boolean'
            }
        };
    }
}
