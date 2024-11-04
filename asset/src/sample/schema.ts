import { ConvictSchema, isNumber } from '@terascope/job-components';
import { SampleConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<SampleConfig> {
    build() {
        return {
            percentage: {
                doc: 'The percentage of documents dropped from the input.  Must be between 0 and 100.  (Default: 0)',
                default: 0,
                format(val: unknown) {
                    if (!isNumber(val) || (val < 0) || (val > 100)) {
                        throw new Error('Percentage must be a number between 0 and 100.');
                    }
                },
            },
            shuffle: {
                doc: 'Shuffle the output array, otherwise all of the duplicate'
                     + 'documents are next to their originals.',
                default: false,
                format: Boolean,
            }
        };
    }
}
