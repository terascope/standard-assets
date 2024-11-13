import { FilterProcessor, DataEntity } from '@terascope/job-components';
import { FilterByUnknownFieldsConfig } from './interfaces.js';

export default class FilterIfUnknownFields extends FilterProcessor<FilterByUnknownFieldsConfig> {
    filter(doc: DataEntity) {
        const hasUnknownFields = Object.keys(doc)
            .filter((field) => !this.opConfig.known_fields.includes(field)).length > 0;

        if (this.opConfig.invert === true) {
            return hasUnknownFields;
        }

        return !hasUnknownFields;
    }
}
