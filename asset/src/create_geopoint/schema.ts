import { BaseSchema } from '@terascope/job-components';
import { CreateGeopointConfig } from './interfaces.js';

export default class Schema extends BaseSchema<CreateGeopointConfig> {
    build(): Record<string, any> {
        return {
            lat_field: {
                doc: 'Name of the field containing the latitude value',
                default: null,
                format: 'required_string'
            },
            lon_field: {
                doc: 'Name of the field containing the longitude value',
                default: null,
                format: 'required_string'
            },
            destination_field: {
                doc: 'Name of the field the geo-point object ({ lat, lon }) is written to',
                default: 'location',
                format: 'String'
            },
            delete_source: {
                doc: 'Delete the lat_field and lon_field after the geo-point is built',
                default: true,
                format: 'Boolean'
            }
        };
    }
}
