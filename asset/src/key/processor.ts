import {
    BatchProcessor,
    DataEntity
} from '@terascope/job-components';
import {
    get,
    isObjectEntity,
    isEmpty,
    isNumber,
    isNumberLike,
    isString,
    toNumber,
    geoHash
} from '@terascope/utils';
import crypto from 'crypto';

export default class Key extends BatchProcessor {
    async onBatch(data: DataEntity[]) {
        if (this._isDataWindow(data)) {
            return this._handleDataWindows(data);
        }

        return this._docsWithValidKey(data);
    }

    async _docsWithValidKey(data: DataEntity[]) {
        const results = [];

        for (const doc of data) {
            const keyValues = this._buildKey(doc);

            if (this._validKeyValues(keyValues)) {
                const key = this._createKey(keyValues);

                if (this.opConfig.preserve_original_key === true) {
                    doc._original_key = doc.getMetadata('_key');
                }

                if (this.opConfig.delete_original) {
                    doc.setMetadata('_delete_id', doc.getMetadata('_key'));
                }

                this._addKey(doc, key);

                results.push(doc);
            }
        }

        return results;
    }

    _buildKey(doc: DataEntity) {
        const keyProps = this._getKeyProps(doc);

        return this._getValues(doc, keyProps);
    }

    _getKeyProps(doc: DataEntity) {
        if (this.opConfig.invert_key_fields) return this._invertKeyProperties(doc);

        if (this.opConfig.key_fields.length) {
            return this.opConfig.key_fields;
        }

        return this._flattenKeys(doc);
    }

    _invertKeyProperties(doc: DataEntity) {
        const keyFields = this._flattenKeys(doc).reduce((keyProperties: string[], property) => {
            if (!this.opConfig.key_fields.includes(property)) {
                keyProperties.push(property);
            }

            return keyProperties;
        }, []);

        keyFields.sort();

        return keyFields;
    }

    _getValues(doc: DataEntity, keyFields: string[]) {
        return keyFields.reduce((values: unknown[], field) => {
            const value = this._getValue(doc, field);

            if (value != null
                || ((Array.isArray(value) || isObjectEntity(value)) && !isEmpty(value))) {
                values.push(value);
            }
            return values;
        }, []);
    }

    _getValue(doc: DataEntity, field: string) {
        const fieldValue = get(doc, field);

        if (this.opConfig.truncate_location && this.opConfig.truncate_location.includes(field)) {
            return this._truncateLocation(fieldValue);
        }

        return fieldValue;
    }

    _truncateLocation(value: unknown) {
        // truncate Geopoint as an array
        if (Array.isArray(value)) {
            return value.map((i) => {
                if (!isNumber(i)) {
                    if (isNumberLike(i)) {
                        return this._truncate(toNumber(i));
                    }
                    throw new Error(`could not convert ${i} to number for location truncation`);
                }

                return this._truncate(i);
            });
        }

        if (isString(value)) {
            // truncate a WKT POINT primitive "POINT (-71.34 41.12)"
            if (value.includes('POINT')) {
                const matches = value.match(/-?\d+\.\d*\s-?\d+\.\d*/);

                if (matches) {
                    const [lon, lat] = matches[0].split(' ');

                    return `POINT (${this._truncate(toNumber(lon))} ${this._truncate(toNumber(lat))})`;
                }
            }

            // Geopoint as a string
            if (value.includes(',')) {
                const [lat, lon] = value.split(',');

                return `${this._truncate(toNumber(lat))}, ${this._truncate(toNumber(lon))}`;
            }

            // Geopoint as a geohash
            try {
                const { lat, lon } = geoHash.decode(value);

                return geoHash.encode(
                    this._truncate(toNumber(lat)),
                    this._truncate(toNumber(lon))
                );
            } catch (e) {
                throw new Error(`could not truncate location ${value}`);
            }
        }

        if (isNumber(value)) {
            return this._truncate(value);
        }

        throw new Error(`could not truncate location with value ${value}`);
    }

    _truncate(value: number) {
        // eslint-disable-next-line no-restricted-properties, prefer-exponentiation-operator
        const numPower = Math.pow(10, this.opConfig.truncate_location_places);

        // eslint-disable-next-line no-bitwise
        return ~~(value * numPower) / numPower;
    }

    _createKey(keyValues: unknown[]) {
        return this._hashKeyValues(keyValues).replace(/=*$/g, '').replace(/\//g, '_').replace(/\+/g, '-');
    }

    _addKey(doc: DataEntity, key: string) {
        doc[this.opConfig.key_name] = key;

        doc.setMetadata(this.opConfig.key_name, key);
    }

    _validKeyValues(keyValues: unknown[]) {
        return keyValues.length >= this.opConfig.minimum_field_count;
    }

    _isDataWindow(data: DataEntity[]) {
        return data.length && 'dataArray' in data[0];
    }

    _handleDataWindows(data: DataEntity[]) {
        for (const dataWindow of data) {
            dataWindow.dataArray = this._docsWithValidKey(dataWindow.asArray());
        }

        return data;
    }

    _hashKeyValues(keyValues: unknown[]) {
        const shasum = crypto.createHash(this.opConfig.hash_algorithm);

        let key = '';

        keyValues.forEach((field) => {
            key += field;
        });

        shasum.update(key);

        return shasum.digest('base64');
    }

    _flattenKeys(doc: Record<string, any>, parent?: string, res: string[] = []) {
        for (const key of Object.keys(doc)) {
            const propName = parent ? `${parent}.${key}` : key;

            const value = get(doc, propName);
            if (isObjectEntity(value)) {
                this._flattenKeys(value, propName, res);
            } else {
                res.push(propName);
            }
        }
        return res;
    }
}
