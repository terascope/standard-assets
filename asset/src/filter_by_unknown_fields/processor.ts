import { FilterProcessor, DataEntity } from '@terascope/job-components';
import { FilterByUnknownFieldsConfig } from './interfaces.js';

/**
 * Removes records from array that has unknown fields.
 * If invert is true - return only records that have unknown fields
*/

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
