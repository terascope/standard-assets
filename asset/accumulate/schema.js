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
            use_data_window: {
                doc: 'Option to return results as a data window',
                default: false,
                format: 'Boolean'
            }
        };
    }
}

module.exports = Schema;
