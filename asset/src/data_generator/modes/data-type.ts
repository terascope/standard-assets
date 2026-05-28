import { FieldType, GeoShapeType } from '@terascope/types';
import type {
    DTConfigWithDataGenOpts, DTFieldConfigWithDataGenOpts, RandomDataCategory
} from '@terascope/types';
import type { DataGenerator } from '../interfaces.js';
import { getFormatFunction, getStartEndDiff, regexID } from './utils.js';

const nativeConfig: DTConfigWithDataGenOpts = {
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

/**
 * Returns a generic description of some of the data type field level config options
 * that can be used to generate the data per field
 */
export function getDTFieldOptions() {
    // type checks to ensures an array has all values from a type in it
    const createTypeArray = <T>() => <U extends T[]>(
        ...args: U & ([T] extends [U[number]] ? U : never[])
    ) => args;

    const categories = createTypeArray<RandomDataCategory>()(
        'aircraft', 'animal', 'book', 'commerce', 'company', 'file', 'finance', 'food', 'job', 'music', 'person', 'pet', 'vehicle'
    ).join(', ');

    const libraries = createTypeArray<Required<Required<DTFieldConfigWithDataGenOpts>['text']>['library']>()(
        'faker', 'chance'
    ).join(', ');

    const ipTypes = createTypeArray<DTFieldConfigWithDataGenOpts['ipType']>()(
        'v4', 'v6', undefined
    )
        .filter(Boolean)
        .join(', ');

    const numOpts = createTypeArray<keyof Required<Required<DTFieldConfigWithDataGenOpts>['numbers']>>()(
        'min', 'max', 'precision'
    ).join(', ');

    const getGeoOpts = () => {
        const args = createTypeArray<keyof Required<Required<DTFieldConfigWithDataGenOpts>['geo']>>()(
            'type', 'boundingBox', 'geometryCount', 'maxRadius', 'vertices'
        );
        args[0] += `(${Object.keys(GeoShapeType)})`;
        return args.join(', ');
    };

    const dataTypeFieldOptsDescription: Record<keyof DTFieldConfigWithDataGenOpts, string> = {
        text: `Refines text fields by library (${libraries}) and/or category (${categories})`,
        numbers: `Refine numeric fields by ${numOpts})`,
        ipType: `Refine ip & ip ranges to only include one of type ${ipTypes}`,
        geo: `Refine geo fields by ${getGeoOpts()}`,
        customize: 'WARNING: This option may override the type. Customize your data by providing one or more of these properties fn (function to return whatever you want), randomExpression, randomExpressionPrefix'
    };

    return JSON.stringify(dataTypeFieldOptsDescription, null, 2);
}
