import { DataGenerator } from '../interfaces.js';
import { FieldType, DataTypeConfig, DataTypeFields, GeoShapeType } from '@terascope/types';
import { getFormatFunction, getStartEndDiff, regexID } from './utils.js';

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

export type FieldOptions = {
    // numbers
    min?: number;
    max?: number;
    precision?: number;
    // words
    // wordType?: Faker['word'];
    ipType?: 'v6' | 'v4';
    geo?: {
        type?: GeoShapeType;
        geometryCount?: number;
        boundingBox?: [number, number, number, number]
            | [number, number, number, number, number, number];
        maxRadius?: number;
        vertices?: number;
    };
    customize?: {
        fn?: () => any;
        randomExpression?: string;
        randomExpressionPrefix?: string;
    };
};

type ValueOf<T> = T[keyof T];
export type DataTypeConfigWithGeneratorOpts = Omit<DataTypeConfig, 'fields'> & {
    fields: {
        [key: string]: (ValueOf<DataTypeFields> & FieldOptions);
    };
};

export default function defaultDataTypeConfig(
    opConfig: DataGenerator
): DataTypeConfigWithGeneratorOpts {
    const config: DataTypeConfigWithGeneratorOpts = nativeConfig;

    const dateKey = opConfig.date_key || 'created';
    const { start, diff } = getStartEndDiff(opConfig);

    if (opConfig.date_key !== 'created') {
        config.fields[opConfig.date_key] = { ...config.fields.created };
        delete config.fields.created;
    }

    if (opConfig.format) {
        config.fields[dateKey].fn = getFormatFunction(opConfig.format, { start, diff });
    }

    if (opConfig.set_id) {
        config.fields.id.options ??= {};
        config.fields.id.randomExpression = regexID(opConfig.set_id).randexp;
    }

    if (opConfig.id_start_key) {
        config.fields.id.options ??= {};
        config.fields.id.prefix = opConfig.id_start_key;
    }

    return config;
}
