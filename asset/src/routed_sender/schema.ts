import {
    ConvictSchema,
    AnyObject,
    isPlainObject,
    getOpConfig,
    ValidatedJobConfig,
    has,
    isNumber,
    getTypeOf,
    isNil
} from '@terascope/job-components';
import { RouteSenderConfig } from './interfaces';

function fetchConfig(job: ValidatedJobConfig) {
    const opConfig = getOpConfig(job, 'routed_sender');
    if (opConfig == null) throw new Error('Could not find routed_sender operation in jobConfig');
    return opConfig as RouteSenderConfig;
}

export default class Schema extends ConvictSchema<RouteSenderConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const { routing, api_name } = fetchConfig(job);

        if (has(routing, '*') && has(routing, '**')) throw new Error('routing cannot specify "*" and "**"');

        const SenderAPI = job.apis.find((jobApi) => jobApi._name === api_name);
        if (isNil(SenderAPI)) throw new Error(`Invalid parameter api_name: ${api_name}, could not find corresponding api on the job configuration`);
    }

    build(): AnyObject {
        return {
            size: {
                doc: 'the maximum number of docs it will take at a time, anything past it will be split up and sent'
                + 'note that the value should be even, the first doc will be the index data and then the next is the data',
                default: 500,
                format(val: any) {
                    if (!isNumber(val)) {
                        throw new Error('Invalid size parameter for routed_sender opConfig, it must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid size parameter for routed_sender, it must be greater than zero');
                    }
                }
            },
            routing: {
                doc: 'Mapping from ID prefix to connection names. Routes data to multiple clusters '
                + 'based on the incoming key. The key name can be a '
                + 'comma separated list of prefixes that will map to the same connection. Prefixes matching takes '
                + 'the first character of the key.',
                default: null,
                format: (val: any) => {
                    if (isPlainObject(val)) {
                        if (Object.keys(val).length === 0 || Object.values(val).filter(Boolean).length === 0) throw new Error('Invalid parameter routing, it must have keys and values set');
                    } else {
                        throw new Error('Invalid parameter routing, it must be an object');
                    }
                }
            },
            api_name: {
                doc: 'Name of the elasticsearch connection to use when sending data.',
                default: null,
                format: 'required_String'
            },
            concurrency: {
                doc: 'The number of inflight calls to the api.send allowed',
                default: 10,
                format(val: unknown) {
                    if (!isNumber(val)) throw new Error(`Invalid parameter concurrency, must be a number, was given ${getTypeOf(val)}`);
                    if (val < 0) throw new Error('Invalid parameter concurrency, it must be a positive integer greater than zero');
                }
            },
        };
    }
}
