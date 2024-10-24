import { ConvictSchema } from '@terascope/job-components';
import { CopyMetadataFieldConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<CopyMetadataFieldConfig> {
    build() {
        return {
            destination: {
                doc: 'The property to copy to',
                format: 'required_String',
                default: null
            },
            meta_key: {
                doc: 'The Dataentity metadata key to copy',
                format: 'required_String',
                default: '_key'
            }
        };
    }
}
