import { MapProcessor } from '@terascope/job-components';
import { DataEntity, get, set } from '@terascope/core-utils';
import { parseGeoPoint } from '@terascope/geo-utils';
import { CreateGeopointConfig } from './interfaces.js';
import DataWindow from '../__lib/data-window.js';

export default class CreateGeopoint extends MapProcessor<CreateGeopointConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        this.createGeopoint(doc);

        return doc;
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => {
            this.createGeopoint(item);
            return item;
        });

        return doc;
    }

    private createGeopoint(doc: DataEntity) {
        const {
            lat_field, lon_field, destination, delete_source
        } = this.opConfig;

        const lat = get(doc, lat_field);
        const lon = get(doc, lon_field);

        // parseGeoPoint normalizes any accepted form to { lat, lon };
        // passing `false` makes it return null (instead of throwing) on invalid input.
        const geoPoint = (lat == null || lon == null)
            ? null
            : parseGeoPoint({ lat, lon }, false);

        if (geoPoint != null) {
            set(doc, destination, geoPoint);
        }

        // Drop the source fields whether or not a geo-point could be built.
        if (delete_source) this.deleteSource(doc);
    }

    private deleteSource(doc: DataEntity) {
        delete doc[this.opConfig.lat_field];
        delete doc[this.opConfig.lon_field];
    }
}
