import { ConvictSchema } from '@terascope/job-components';
import { DateRouterConfig } from '@terascope/standard-asset-apis';

export default class Schema extends ConvictSchema<DateRouterConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Field to remove from incoming document',
                default: null,
                format: 'required_String'
            }
        };
    }
}
