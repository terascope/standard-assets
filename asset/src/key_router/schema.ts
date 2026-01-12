import { isBoolean, isNumber, isString } from '@terascope/core-utils';
import {
    BaseSchema, ValidatedJobConfig, getOpConfig, OpConfig
} from '@terascope/job-components';
import { KeyRouterConfig, KeyRouterFromOptions, KeyRouterCaseOptions } from '@terascope/standard-asset-apis';

export default class Schema extends BaseSchema<KeyRouterConfig & OpConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const op = getOpConfig(job, 'key_router') as KeyRouterConfig;
        if ((op.from && !op.use) || (!op.from && op.use)) {
            throw new Error('Invalid parameters, if "from" or "use" are specified, they must be used together');
        }
        if (op.suffix_use && (!op.use || !op.from)) {
            throw new Error('Invalid parameters, if "suffix_use" is specified then "from" and "use" should be specified, they must be used together');
        }
        if (op.suffix_use
            && op.suffix_upper === ''
            && op.suffix_lower === ''
            && op.suffix_other === ''
            && op.suffix_number === '') {
            throw new Error('Invalid parameters, suffix_use requires that at least one suffix_(upper/lower/other/number) value be specified');
        }
    }

    build(): Record<string, any> {
        return {
            use: {
                doc: 'The number of characters to slice off the key and use as the routing value',
                default: undefined,
                format: (val: any) => {
                    if (val !== undefined) {
                        if (!isNumber(val)) throw new Error('Parameter "use" must be a number');
                    }
                }
            },
            from: {
                doc: 'Whether the characters are sliced from the beginning or end of the key',
                default: undefined,
                format: (val: any) => {
                    if (val !== undefined) {
                        if (!Object.keys(KeyRouterFromOptions).includes(val)) {
                            throw new Error('Parameter "from" must set to either "beginning" or "end"');
                        }
                    }
                }
            },
            case: {
                doc: 'transform to apply to the values extracted from the key',
                default: KeyRouterCaseOptions.preserve,
                format: Object.keys(KeyRouterCaseOptions)
            },
            suffix_use: {
                doc: 'append suffix to extracted value',
                default: false,
                format: (val: any) => {
                    if (val !== undefined) {
                        if (!isBoolean(val)) throw new Error('Parameter "suffix_use" must be a boolean');
                    }
                }
            },
            suffix_upper: {
                doc: 'suffix value to append to extracted value for upper case values',
                default: '',
                format: (val: any) => {
                    if (val !== undefined) {
                        if (!isString(val)) throw new Error('Parameter "suffix_upper" must be a string');
                    }
                }
            },
            suffix_lower: {
                doc: 'suffix value to append to extracted value for upper case values',
                default: '',
                format: (val: any) => {
                    if (val !== undefined) {
                        if (!isString(val)) throw new Error('Parameter "suffix_lower" must be a string');
                    }
                }
            },
            suffix_number: {
                doc: 'suffix value to append to extracted value for number values',
                default: '',
                format: (val: any) => {
                    if (val !== undefined) {
                        if (!isString(val)) throw new Error('Parameter "suffix_number" must be a string');
                    }
                }
            },
            suffix_other: {
                doc: 'suffix value to append to extracted value when value is not a letter or number',
                default: '',
                format: (val: any) => {
                    if (val !== undefined) {
                        if (!isString(val)) throw new Error('Parameter "suffix_other" must be a string');
                    }
                }
            }

        };
    }
}
