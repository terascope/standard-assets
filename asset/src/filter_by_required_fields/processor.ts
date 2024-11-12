import { FilterProcessor, DataEntity, isNil } from '@terascope/job-components';
import { FilterByRequiredFieldConfig, LogicType } from './interfaces.js';

export default class FilterByRequiredFields extends FilterProcessor<FilterByRequiredFieldConfig> {
    filter(doc: DataEntity) {
        const keep = this._keepDoc(doc);

        if (this.opConfig.invert) {
            return !keep;
        }

        return keep;
    }

    _keepDoc(doc: DataEntity) {
        if (this.opConfig.filter_type === LogicType.OR) {
            return this.opConfig.required_fields.some((field) => this._validValue(doc[field]));
        }

        return this.opConfig.required_fields.every((field) => this._validValue(doc[field]));
    }

    _validValue(value: unknown) {
        return isNil(value);
    }
}
