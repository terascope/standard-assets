import { BaseSchema } from '@terascope/job-components';
import { CopyMetadataFieldConfig } from './interfaces.js';

export default class Schema extends BaseSchema<CopyMetadataFieldConfig> {
    build() {
        return {
            destination: {
                doc: 'The property to copy to',
                format: 'required_string',
                default: null
            },
            meta_key: {
                doc: 'The Dataentity metadata key to copy',
                format: 'required_string',
                default: '_key'
            }
        };
    }
}
