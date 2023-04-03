import { ConvictSchema } from '@terascope/job-components';
import { DateRouterConfig } from '@terascope/standard-asset-apis';

export default class Schema extends ConvictSchema<DateRouterConfig> {
    build(): Record<string, any> {
        return {
            source: {
                doc: 'Source of the value to copy',
                default: null,
                format: 'required_String'
            },
            destination: {
                doc: 'Destination of copied field',
                default: null,
                format: 'required_String'
            }
        };
    }
}
