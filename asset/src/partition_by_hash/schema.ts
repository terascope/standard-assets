import { ConvictSchema } from '@terascope/job-components';
import { PartitionByHashConfig } from './interfaces';

export default class Schema extends ConvictSchema<PartitionByHashConfig> {
    build() {
        return {
            fields: {
                doc: 'Specifies fields to hash for partitioning. Must specify at least one field.',
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
            partitions: {
                doc: 'Number of partitions to use with hashing',
                default: null,
                format: Number
            },
            delimiter: {
                doc: 'Char which will be used to join by',
                default: '/',
                format: 'optional_String'
            }
        };
    }
}

module.exports = Schema;
