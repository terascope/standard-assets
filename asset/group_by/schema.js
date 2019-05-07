'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            field: {
                doc: 'Name of field to group each record by',
                default: 'metadata_key',
                format: 'String',
            },
            uniq_values: {
                doc: 'Return only uniq values per group',
                default: false,
                format: 'Boolean'
            },
            dedup_field: {
                doc: 'Field to dedup on',
                default: '_id',
                format: 'String'
            }
        };
    }
}

module.exports = Schema;
