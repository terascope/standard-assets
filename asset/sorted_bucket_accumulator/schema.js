'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            sort_field: {
                doc: 'The field in the input records to use for sorting',
                default: '',
                format: 'String',
            },
            order: {
                doc: 'The field in the input records to use for sorting',
                default: 'asc',
                format: ['asc', 'desc']
            },
            empty_after: {
                doc: 'How many 0 record slices to require before starting to return the accumulated data',
                default: 10,
                format: 'Number'
            },
            batch_size: {
                doc: 'Once the accumulator starts emptying, how many records to return per slice.',
                default: 1000,
                format: 'Number'
            },
            keyed_batch: {
                doc: 'Returns an array containing a single object where each key contains the sorted data for that key.',
                default: false,
                format: 'Boolean'
            }
        };
    }
}

module.exports = Schema;
