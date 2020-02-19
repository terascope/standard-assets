import { ConvictSchema } from '@terascope/job-components';
import { PartitionByFieldsConfig } from './interfaces';

export default class Schema extends ConvictSchema<PartitionByFieldsConfig> {
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
            delimiter: {
                doc: 'Char which will be used to join by',
                default: '/',
                format: 'optional_String'
            }
        };
    }
}
