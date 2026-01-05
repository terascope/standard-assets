import {
    getTypeOf, isNotNil, isNumber, isString
} from '@terascope/core-utils';
import { ConvictSchema, OpConfig } from '@terascope/job-components';
import { HashRouterConfig } from '@terascope/standard-asset-apis';

export default class Schema extends ConvictSchema<HashRouterConfig & OpConfig> {
    build(): Record<string, any> {
        return {
            fields: {
                doc: 'Specifies fields to hash for partitioning. Must specify at least one field.',
                default: [],
                format: (fields: any) => {
                    if (isNotNil(fields)) {
                        if (!Array.isArray(fields)) {
                            throw new Error('Invalid `fields` option: must be an array.');
                        }
                        if (!fields.every(isString)) {
                            throw new Error('Invalid fields parameter, if specified it must be an array of strings');
                        }
                    }
                }
            },
            partitions: {
                doc: 'Number of partitions to use with hashing',
                default: null,
                format: (val: unknown): void => {
                    if (isNumber(val)) {
                        if (val <= 0) throw new Error('Parameter partitions is invalid, it must be set to a number > 0');
                    } else {
                        throw new Error(`Parameter partitions is invalid, it must be a number, received ${getTypeOf(val)}`);
                    }
                }
            },
        };
    }
}
