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
            }
        };
    }
}

module.exports = Schema;
