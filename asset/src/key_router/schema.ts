import {
    ConvictSchema, isNumber, ValidatedJobConfig, getOpConfig
} from '@terascope/job-components';
import { KeyRouterConfig, FromOptions, CaseOptions } from './interfaces';

export default class Schema extends ConvictSchema<KeyRouterConfig> {
    validateJob(job: ValidatedJobConfig) {
        const op = getOpConfig(job, 'key_router') as KeyRouterConfig;
        if ((op.from && !op.use) || (!op.from && op.use)) {
            throw new Error('Invalid parameters, if "from" or "use" are specified, they must be used together');
        }
    }

    build() {
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
                        if (!Object.keys(FromOptions).includes(val)) {
                            throw new Error('Parameter "from" must set to either "beginning" or "end"');
                        }
                    }
                }
            },
            case: {
                doc: 'transform to apply to the values extracted from the key',
                default: CaseOptions.preserve,
                format: Object.keys(CaseOptions)
            }
        };
    }
}
