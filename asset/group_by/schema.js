'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            field: {
                doc: 'Name of field to group each record by',
                default: undefined,
                format: 'String',
            }
        };
    }
}

module.exports = Schema;
