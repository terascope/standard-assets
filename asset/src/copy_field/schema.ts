import { BaseSchema } from '@terascope/job-components';
import { CopyFieldConfig } from './interfaces.js';

export default class Schema extends BaseSchema<CopyFieldConfig> {
    build(): Record<string, any> {
        return {
            source: {
                doc: 'Name of the field to copy value from',
                default: null,
                format: 'required_string'
            },
            destination: {
                doc: 'Name of the field that copied value is written to',
                default: null,
                format: 'required_string'
            },
            delete_source: {
                doc: 'Option to delete the source field',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
