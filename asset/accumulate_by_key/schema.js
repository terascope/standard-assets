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
            key_field: {
                doc: 'Field to key docs by',
                default: '_key',
                format: 'required_String'
            }
        };
    }
}

module.exports = Schema;
