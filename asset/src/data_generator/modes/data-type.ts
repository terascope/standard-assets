import { FieldType } from '@terascope/types';
import type { DataTypeConfig, DataTypeFieldConfig, GeoShapeType } from '@terascope/types';
import type { DataGenerator } from '../interfaces.js';
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

export default function defaultDataTypeConfig(
    opConfig: DataGenerator
): DTConfigWithDataGenOpts {
    const config: DTConfigWithDataGenOpts = nativeConfig;

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

const _categories = [
    'aircraft', 'animal', 'book', 'commerce', 'company', 'file', 'finance', 'food', 'job', 'music', 'person', 'pet', 'vehicle'
] as const;
export type Category = typeof _categories[number];

type RandomDataFieldOptions = {
    // options for fine tuning text fields in a small amount of cases
    // - category - i.e. if field name contains "name" the category may help
    // - library - i.e. if field name is "animal" - these libraries return different animal types
    text?: {
        category?: Category;
        library?: 'chance' | 'faker';
    };
    // options for narrowing numeric fields where appropriate
    numbers?: {
        min?: number;
        max?: number;
        precision?: number;
    };
    // for narrowing the ip data to only 1 type
    ipType?: 'v6' | 'v4';
    // for narrowing geo data
    geo?: {
        type?: GeoShapeType;
        geometryCount?: number;
        boundingBox?: [number, number, number, number]
            | [number, number, number, number, number, number];
        maxRadius?: number;
        vertices?: number;
    };
    // overrides default data by field type - so type-correctness is unknown
    customize?: {
        fn?: () => any;
        randomExpression?: string;
        randomExpressionPrefix?: string;
    };
};

export type DTFieldConfigWithDataGenOpts = DataTypeFieldConfig & RandomDataFieldOptions;

export type DTConfigWithDataGenOpts = Omit<DataTypeConfig, 'fields'> & {
    fields: {
        [key: string]: DTFieldConfigWithDataGenOpts;
    };
};
