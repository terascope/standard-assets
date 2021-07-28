import { ConvictSchema } from '@terascope/job-components';
import { JobMetricExampleConfig } from './interfaces';

export default class Schema extends ConvictSchema<JobMetricExampleConfig> {
    build(): Record<string, any> {
        return {
            type: {
                doc: 'An example of a property schema',
                default: 'string',
                format: 'String',
            },
            metric_api_name: {
                doc: 'Name of the metric api',
                default: 'job_metric_api',
                format: 'String'
            },
            collect_metrics: {
                doc: 'enable metric collection',
                default: true,
                format: 'Boolean'
            }
        };
    }
}
