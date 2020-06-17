import { ConvictSchema, isString, isNumber } from '@terascope/job-components';
import { HashRouterConfig } from './interfaces';

export default class Schema extends ConvictSchema<HashRouterConfig> {
    build(): Record<string, any> {
        return {
            fields: {
                doc: 'Specifies fields to hash for partitioning. Must specify at least one field.',
                default: [],
                format: (fields: any) => {
                    if (!Array.isArray(fields)) {
                        throw new Error('Invalid `fields` option: must be an array.');
                    }
                    if (fields.length > 0 && !fields.every(isString)) {
                        throw new Error('Invalid fields parameter, if specified it must be an array of strings');
                    }
                }
            },
            buckets: {
                doc: 'Number of partitions to use with hashing',
                default: null,
                format: isNumber
            },
        };
    }
}
