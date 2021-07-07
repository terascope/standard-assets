import { ConvictSchema } from '@terascope/job-components';
import { JobMetricAPIConfig } from './interfaces';

export default class Schema extends ConvictSchema<JobMetricAPIConfig> {
    build(): Record<string, any> {
        return {
            port: {
                default: 3333,
                format: 'Number'
            },
            default_metrics: {
                default: true,
                format: 'Boolean'
            }
        };
    }
}
