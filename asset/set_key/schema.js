'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            field: {
                doc: 'Field name of value used to set key',
                default: '_id',
                format: 'required_String',
            }
        };
    }
}

module.exports = Schema;
