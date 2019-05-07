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
            },
            batch_return: {
                doc: 'If true will return arrays of specified batch_size',
                default: false,
                format: 'Boolean'
            },
            batch_size: {
                doc: 'Size of batches to return',
                default: 1000,
                format: (value) => {
                    if (!Number.isInteger(value) || value < 1) {
                        throw new Error('batch size must be an integer greater then 0');
                    }
                }
            },
            uniq_values: {
                doc: 'Only return uniq values',
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
