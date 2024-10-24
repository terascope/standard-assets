import { MapProcessor, DataEntity } from '@terascope/job-components';
import { CopyMetadataFieldConfig } from './interfaces.js';

// generalize any meta data field retrieval CopyMetadataField
export default class CopyMetadataField extends MapProcessor<CopyMetadataFieldConfig> {
    map(doc: DataEntity) {
        doc[this.opConfig.destination] = doc.getMetadata(this.opConfig.meta_key);
        return doc;
    }
}
