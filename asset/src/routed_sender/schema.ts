import {
    ConvictSchema, getOpConfig,
} from '@terascope/job-components';
import { Terafoundation, ValidatedJobConfig } from '@terascope/types';
import { RouteSenderConfig } from './interfaces.js';
import {
    has, isNil, isPlainObject
} from '@terascope/core-utils';

function fetchConfig(job: ValidatedJobConfig) {
    const opConfig = getOpConfig(job, 'routed_sender');
    if (opConfig == null) throw new Error('Could not find routed_sender operation in jobConfig');
    return opConfig as RouteSenderConfig;
}

export default class Schema extends ConvictSchema<RouteSenderConfig> {
    validateJob(job: ValidatedJobConfig): void {
        const { routing, _api_name } = fetchConfig(job);

        if (has(routing, '*') && has(routing, '**')) throw new Error('routing cannot specify "*" and "**"');

        const SenderAPI = job.apis.find((jobApi) => jobApi._name === _api_name);
        if (isNil(SenderAPI)) throw new Error(`Invalid parameter _api_name: ${_api_name}, could not find corresponding api on the job configuration`);
    }

    build(): Terafoundation.Schema<Omit<RouteSenderConfig, '_op'>> {
        return {
            routing: {
                doc: 'Mapping of `standard:route` metadata to connection names. Routes data to multiple clusters '
                    + 'based on the incoming key. The key name can be a '
                    + 'comma separated list of prefixes that will map to the same connection.',
                default: null,
                format: (val: any) => {
                    if (isPlainObject(val)) {
                        if (Object.keys(val).length === 0 || Object.values(val).filter(Boolean).length === 0) throw new Error('Invalid parameter routing, it must have keys and values set');
                    } else {
                        throw new Error('Invalid parameter routing, it must be an object');
                    }
                }
            },
            _api_name: {
                doc: 'Name of the elasticsearch connection to use when sending data.',
                default: null,
                format: 'required_string'
            },
        };
    }
}
