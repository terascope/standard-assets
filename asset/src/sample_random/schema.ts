import { ConvictSchema, isNumber } from '@terascope/job-components';
import { SampleRandomConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<SampleRandomConfig> {
    build() {
        return {
            probability_to_keep: {
                doc: 'The probability of the record being kept. It iterates through the array and generates a random number between 0 and 100, and if the number <= probability it is kept. Must be between 0 and 100, with 100 keeping all records and 0 rejecting all records. (Default: 100)',
                default: 100,
                format(val: unknown) {
                    if (!isNumber(val) || (val < 0) || (val > 100)) {
                        throw new Error('probability must be a number between 0 and 100.');
                    }
                },
            }
        };
    }
}
