'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            empty_after: {
                doc: 'How many 0 record slices to require before starting to return the accumulated data',
                default: 10,
                format: 'Number'
            },
            batch_size: {
                doc: 'Once the accumulator starts emptying, how many records to return per slice.',
                default: 1000,
                format: 'Number'
            }
        };
    }
}

module.exports = Schema;
