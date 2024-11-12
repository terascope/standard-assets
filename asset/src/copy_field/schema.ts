import { ConvictSchema } from '@terascope/job-components';
import { CopyFieldConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<CopyFieldConfig> {
    build(): Record<string, any> {
        return {
            source: {
                doc: 'Name of the field to copy value from',
                default: null,
                format: 'required_String'
            },
            destination: {
                doc: 'Name of the field that copied value is written to',
                default: null,
                format: 'required_String'
            },
            delete_source: {
                doc: 'Option to delete the source field',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
