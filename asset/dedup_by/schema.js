'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            field: {
                doc: 'field to dedup records on',
                default: undefined,
                format: 'String',
            },
            adjust_time: {
                doc: 'Adjust first and last seen',
                default: false,
                format: 'Boolean'
            }
        };
    }
}

module.exports = Schema;