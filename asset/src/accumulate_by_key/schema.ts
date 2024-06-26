import { ConvictSchema, isInteger } from '@terascope/job-components';
import { AccumulateByKeyConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<AccumulateByKeyConfig> {
    build(): Record<string, any> {
        return {
            empty_after: {
                doc: 'How many 0 record slices to require before starting to return the accumulated data',
                default: 10,
                format: Number
            },
            key_field: {
                doc: 'Field to key docs by',
                default: undefined,
                format: String
            },
            batch_return: {
                doc: 'If true will return arrays of specified batch_size',
                default: false,
                format: Boolean
            },
            batch_size: {
                doc: 'Size of batches to return',
                default: 1000,
                format: (value: any) => {
                    if (!isInteger(value) || value < 1) {
                        throw new Error('batch size must be an integer greater then 0');
                    }
                }
            },
            flush_data_on_shutdown: {
                doc: 'Option to flush partial data accumulation on unexpected shutdown',
                default: false,
                format: Boolean
            }
        };
    }
}
