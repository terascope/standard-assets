import {
    BatchProcessor,
    DataEntity,
    AnyObject
} from '@terascope/job-components';
import {
    get,
    isObjectEntity,
    isEmpty,
    isNumberLike,
    isString,
    toNumber,
    geoHash
} from '@terascope/utils';
import crypto from 'crypto';
import DataWindow from '../__lib/data-window';

export default class AddKey extends BatchProcessor {
    async onBatch(data: DataEntity[] | DataWindow[]) {
        if (this.isDataWindow(data)) {
            return this.handleDataWindows(data as DataWindow[]);
        }

        return this.keyDocs(data);
    }

    private keyDocs(data: DataEntity[]) {
        return data.reduce((keyed: DataEntity[], doc) => {
            const values = this.getValues(doc, this.getKeyFields(doc));

            if (values.length >= this.opConfig.minimum_field_count) {
                const key = this.createKey(values);

                if (this.opConfig.preserve_original_key === true) {
                    doc._original_key = doc.getMetadata('_key');
                }

                if (this.opConfig.delete_original) {
                    doc.setMetadata('_delete_id', doc.getMetadata('_key'));
                }

                this.addKey(doc, key);

                keyed.push(doc);
            }

            return keyed;
        }, []);
    }

    private getKeyFields(doc: DataEntity) {
        if (this.opConfig.invert_key_fields) return this.invertKeyProperties(doc);

        if (this.opConfig.key_fields.length) {
            return this.opConfig.key_fields;
        }

        return Object.keys(doc).sort();
    }

    private invertKeyProperties(doc: DataEntity) {
        return Object.keys(doc).reduce((keyProperties: string[], property) => {
            if (!this.opConfig.key_fields.includes(property)) {
                keyProperties.push(property);
            }

            return keyProperties;
        }, []).sort();
    }

    private getValues(doc: DataEntity, keyFields: string[]) {
        return keyFields.reduce((values: unknown[], field) => {
            const value = this.getValue(doc, field);

            if (value != null) {
                if ((Array.isArray(value) || isObjectEntity(value)) && isEmpty(value)) {
                    return values;
                }

                values.push(value);
            }
            return values;
        }, []);
    }

    private getValue(doc: DataEntity, field: string) {
        const fieldValue = get(doc, field);

        if (this.opConfig.truncate_location && this.opConfig.truncate_location.includes(field)) {
            return this.truncateLocation(fieldValue);
        }

        return fieldValue;
    }

    private truncateLocation(value: unknown) {
        // supports geo-points defined here https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-point.html
        if (isObjectEntity(value)) return this.truncateObjectGeoPoint(value as AnyObject);

        if (Array.isArray(value)) return this.truncateArrayGeoPoint(value);

        // if listing nested lat, lon separately like location.lat
        if (isNumberLike(value)) return this.truncate(toNumber(value));

        if (isString(value)) return this.truncateStringGeoPoint(value);

        throw new Error(`could not truncate location with value ${value}`);
    }

    private truncateObjectGeoPoint(value: AnyObject): { lat: number, lon: number } {
        const { lat, lon } = value as AnyObject;

        if (lat != null && lon != null && isNumberLike(lat) && isNumberLike(lon)) {
            return { lat: this.truncate(toNumber(lat)), lon: this.truncate(toNumber(lon)) };
        }

        throw new Error(`could truncate location ${value}`);
    }

    private truncateArrayGeoPoint(value: unknown[]): number[] {
        return value.map((i) => {
            if (isNumberLike(i)) return this.truncate(toNumber(i));

            throw new Error(`could truncate location ${value}`);
        });
    }

    private truncateStringGeoPoint(value: string): string {
        // WKT POINT primitive, e.g. "POINT (-71.34 41.12)"
        if (value.includes('POINT')) {
            const matches = value.match(/-?\d+\.\d*\s-?\d+\.\d*/);

            if (matches) {
                const [lon, lat] = matches[0].split(' ');

                return `POINT (${this.truncate(toNumber(lon))} ${this.truncate(toNumber(lat))})`;
            }
        }

        // number string
        if (value.includes(',')) {
            const [lat, lon] = value.split(',');

            return `${this.truncate(toNumber(lat))}, ${this.truncate(toNumber(lon))}`;
        }

        // geohash
        try {
            const { lat, lon } = geoHash.decode(value);

            return geoHash.encode(
                this.truncate(toNumber(lat)),
                this.truncate(toNumber(lon))
            );
        } catch (e) {
            throw new Error(`could not truncate location ${value}`);
        }
    }

    private truncate(value: number) {
        // eslint-disable-next-line no-restricted-properties, prefer-exponentiation-operator
        const numPower = Math.pow(10, this.opConfig.truncate_location_places);

        // eslint-disable-next-line no-bitwise
        return ~~(value * numPower) / numPower;
    }

    private addKey(doc: DataEntity, key: string) {
        doc[this.opConfig.key_name] = key;

        doc.setMetadata(this.opConfig.key_name, key);
    }

    private isDataWindow(data: DataEntity[]) {
        return data.length && 'dataArray' in data[0];
    }

    private handleDataWindows(data: DataWindow[]) {
        for (const dataWindow of data) {
            dataWindow.dataArray = this.keyDocs(dataWindow.asArray());
        }

        return data;
    }

    private createKey(keyValues: unknown[]) {
        const shasum = crypto.createHash(this.opConfig.hash_algorithm);

        let key = '';

        keyValues.forEach((field) => {
            key += field;
        });

        shasum.update(key);

        return shasum.digest('base64').replace(/=*$/g, '').replace(/\//g, '_').replace(/\+/g, '-');
    }
}
