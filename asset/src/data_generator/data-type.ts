import { DataGenerator } from './interfaces.js';
import { FieldType, DataTypeConfig } from '@terascope/types';

const nativeConfig: DataTypeConfig = {
    fields: {
        ip: {
            type: FieldType.IP
        },
        userAgent: {
            type: FieldType.String
        },
        url: {
            type: FieldType.String
        },
        uuid: {
            type: FieldType.Keyword
        },
        created: {
            type: FieldType.Date
        },
        ipv6: {
            type: FieldType.IP
        },
        location: {
            type: FieldType.GeoPoint
        },
        bytes: {
            type: FieldType.Byte
        }
    }
};

export default function defaultDataTypeConfig(
    opConfig: DataGenerator
): DataTypeConfig {
    const config: DataTypeConfig = nativeConfig;

    if (opConfig.date_key !== 'created') {
        config.fields[opConfig.date_key] = config.fields.created;
        delete config.fields.created;
    }

    if (opConfig.format) {
        throw new Error('Mode "data_type" does not support "format"');
    }

    if (opConfig.set_id) {
        // NOTE: using faker js hexadecimal might work if this is a desired feature
        throw new Error('Mode "data_type" only does not support "set_id"');
    }

    if (opConfig.id_start_key) {
        throw new Error('Mode "data_type" only does not support "id_start_key"');
    }

    return config;
}
