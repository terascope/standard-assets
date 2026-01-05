import { isNumber } from '@terascope/core-utils';
import { ConvictSchema } from '@terascope/job-components';
import { SampleExactConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<SampleExactConfig> {
    build() {
        return {
            percent_kept: {
                doc: 'The percentage of documents to be kept from the input. Must be between 0 and 100. (Default: 100)',
                default: 100,
                format(val: unknown) {
                    if (!isNumber(val) || (val < 0) || (val > 100)) {
                        throw new Error('Percentage must be a number between 0 and 100.');
                    }
                },
            }
        };
    }
}
