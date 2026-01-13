import { BaseSchema } from '@terascope/job-components';
import { SetKeyConfig } from './interfaces.js';

export default class Schema extends BaseSchema<SetKeyConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Field name of value used to set key',
                default: '_key',
                format: 'required_string',
            }
        };
    }
}
