import { ConvictSchema, AnyObject } from '@terascope/job-components';
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
                        throw new Error('Invalid size parameter for elasticsearch_bulk opConfig, it must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid size parameter for elasticsearch_bulk, it must be greater than zero');
                    }
                }
            },
            routing: {
                doc: 'Mapping from ID prefix to connection names. Routes data to multiple clusters '
                + 'based on the incoming key. Used when multisend is set to true. The key name can be a '
                + 'comma separated list of prefixes that will map to the same connection. Prefixes matching takes '
                + 'the first character of the key.',
                default: {
                    '*': 'default'
                },
                format: Object
            },
            api_name: {
                doc: 'Name of the elasticsearch connection to use when sending data.',
                default: null,
                format: 'required_String'
            },
        };
    }
}
