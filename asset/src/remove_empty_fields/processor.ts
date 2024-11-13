import { MapProcessor, DataEntity, isEmpty } from '@terascope/job-components';

export default class RemoveEmptyProperties extends MapProcessor {
    map(doc: DataEntity) {
        for (const [key, value] of Object.entries(doc)) {
            if (this._isEmptyField(value)) delete doc[key];
        }

        return doc;
    }

    _isEmptyField(value: unknown) {
        if (typeof value === 'boolean' || typeof value === 'number') return false;

        if (value == null) return true;

        // handles string
        if (typeof value === 'string') {
            return isEmpty(value.trim());
        }

        //  object, array
        return isEmpty(value);
    }
}
