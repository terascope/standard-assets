import {
    BatchProcessor,
    DataEntity,
    AnyObject
} from '@terascope/job-components';
import {
    get,
    isObjectEntity,
    isEmpty,
    isString,
    toNumber,
    geoHash,
    setPrecision,
    isGeoShapePoint
} from '@terascope/utils';
import {
    GeoShapePoint,
    GeoShapeType
} from '@terascope/types';

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

        if (this.opConfig.truncate_location
            && this.opConfig.truncate_location.includes(field)
            && fieldValue != null) {
            try {
                return this.truncateLocation(fieldValue);
            } catch (e) {
                this.rejectRecord(doc, e as Error);
            }
        }

        return fieldValue;
    }

    private truncateLocation(value: unknown) {
        // supports geo-points defined here https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-point.html
        if (isGeoShapePoint(value)) {
            return this.truncateGeoJSONPoint(value);
        }

        if (this.isGeoPointObject(value as AnyObject)) {
            return this.truncateObjectGeoPoint(value as AnyObject);
        }

        if (Array.isArray(value)) {
            return this.truncateArrayGeoPoint(value);
        }

        // if truncating nested lat, lon values independently
        if (this.isLatOrLon(value)) {
            return this.truncate(toNumber(value));
        }

        if (isString(value)) {
            return this.truncateStringGeoPoint(value);
        }

        throw new Error(`could not truncate location with value ${value}`);
    }

    private truncateGeoJSONPoint(value: GeoShapePoint): GeoShapePoint {
        // eg, { "type": "Point", "coordinates": [-71.34, 41.12] }
        const [lon, lat] = value.coordinates;

        if (this.validCoordinates(lat, lon)) {
            return {
                type: GeoShapeType.Point,
                coordinates: [
                    this.truncate(toNumber(lon)),
                    this.truncate(toNumber(lat))
                ]
            };
        }

        throw new Error(`could not truncate GeoJSON point ${value}`);
    }

    private isGeoPointObject(value: AnyObject) {
        const { lat, lon } = value;

        return this.validCoordinates(lat, lon);
    }

    private truncateObjectGeoPoint(value: AnyObject): { lat: number, lon: number } {
        // eg, { "lat": 41.12, "lon": -71.34 }
        const { lat, lon } = value as AnyObject;

        if (this.validCoordinates(lat, lon)) {
            return { lat: this.truncate(toNumber(lat)), lon: this.truncate(toNumber(lon)) };
        }

        throw new Error(`could not truncate geo-point ${value}`);
    }

    private truncateArrayGeoPoint(value: unknown[]): number[] {
        // eg,  [ -71.34, 41.12 ]
        return value.map((i) => {
            if (this.isLatOrLon(i)) return this.truncate(toNumber(i));

            throw new Error(`could truncate array geo-point ${value}`);
        });
    }

    private truncateStringGeoPoint(value: string): string {
        // WKT POINT primitive, e.g. "POINT (-71.34 41.12)"
        if (value.includes('POINT')) {
            const matches = value.match(/-?\d+\.\d*\s-?\d+\.\d*/);

            if (matches) {
                const [lon, lat] = matches[0].split(' ');

                if (this.validCoordinates(lat, lon)) {
                    return `POINT (${this.truncate(toNumber(lon))} ${this.truncate(toNumber(lat))})`;
                }

                throw new Error(`could not truncate string geo point ${value}`);
            }
        }

        // number string, "41.12,-71.34"
        if (value.includes(',')) {
            const [lat, lon] = value.split(',');

            if (this.validCoordinates(lat, lon)) {
                return `${this.truncate(toNumber(lat))}, ${this.truncate(toNumber(lon))}`;
            }

            throw new Error(`could not truncate string geo point ${value}`);
        }

        // geohash, drm3btev3e86
        try {
            const { lat, lon } = geoHash.decode(value);

            return geoHash.encode(
                this.truncate(toNumber(lat)),
                this.truncate(toNumber(lon))
            );
        } catch (e) {
            throw new Error(`could not truncate geohash location ${value}`);
        }
    }

    private validCoordinates(lat: unknown, lon: unknown) {
        return this.isLatOrLon(lat) && this.isLatOrLon(lon);
    }

    private isLatOrLon(value: unknown) {
        return value != null && !isNaN(toNumber(value));
    }

    private truncate(value: number | string) {
        return setPrecision(
            value,
            this.opConfig.truncate_location_places,
            true
        );
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
