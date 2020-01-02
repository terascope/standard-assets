import { ConvictSchema } from '@terascope/job-components';
import { AccumulateConfig } from './interfaces';

export default class Schema extends ConvictSchema<AccumulateConfig> {
    build() {
        return {
            empty_after: {
                doc: 'How many 0 record slices to require before starting to return the accumulated data',
                default: 10,
                format: 'Number'
            },
            flush_data_on_shutdown: {
                doc: 'Option to flush partial data accumulation on unexpected shutdown',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
