'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            dedup_field: {
                doc: 'field to dedup records on',
                default: '_id',
                format: 'String',
            },
            adjust_times: {
                doc: 'Adjust first and last seen',
                default: false,
                format: 'Boolean'
            }
        };
    }
}

module.exports = Schema;
