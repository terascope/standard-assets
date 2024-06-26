import {
    ConvictSchema, isNumber, getTypeOf, isBoolean
} from '@terascope/job-components';
import { AccumulateConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<AccumulateConfig> {
    build(): Record<string, any> {
        return {
            empty_after: {
                doc: 'How many 0 record slices to require before starting to return the accumulated data',
                default: 10,
                format: (val: unknown) => {
                    if (isNumber(val)) {
                        if (val < 0) throw new Error('Invalid parameter empty_after, this value must be >= 0');
                    } else {
                        throw new Error(`Invalid parameter empty_after, must be of type number, got ${getTypeOf(val)}`);
                    }
                }
            },
            flush_data_on_shutdown: {
                doc: 'Option to flush partial data accumulation on unexpected shutdown',
                default: false,
                format: (val: unknown):void => {
                    if (!isBoolean(val)) throw new Error(`Invalid parameter flush_data_on_shutdown, expected boolean, got ${getTypeOf(val)}`);
                }
            }
        };
    }
}
