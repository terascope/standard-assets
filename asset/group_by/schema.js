'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            field_name: {
                doc: 'Name of field to group each record by',
                default: 'id',
                format: 'required_String',
            }
        };
    }
}

module.exports = Schema;
