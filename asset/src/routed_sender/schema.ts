import { ConvictSchema, AnyObject, isPlainObject } from '@terascope/job-components';
import { isNumber, getTypeOf } from '@terascope/utils';
import { RouteSenderConfig } from './interfaces';

export default class Schema extends ConvictSchema<RouteSenderConfig> {
    build(): AnyObject {
        return {
            size: {
                doc: 'the maximum number of docs it will take at a time, anything past it will be split up and sent'
                + 'note that the value should be even, the first doc will be the index data and then the next is the data',
                default: 500,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid size parameter for routed_sender opConfig, it must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid size parameter for routed_sender, it must be greater than zero');
                    }
                }
            },
            routing: {
                doc: 'Mapping from ID prefix to connection names. Routes data to multiple clusters '
                + 'based on the incoming key. Used when multisend is set to true. The key name can be a '
                + 'comma separated list of prefixes that will map to the same connection. Prefixes matching takes '
                + 'the first character of the key.',
                default: null,
                format: (val: any) => {
                    if (val !== null) {
                        if (!isPlainObject(val)) throw new Error('Invalid parameter, connection_map must be an object');
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
