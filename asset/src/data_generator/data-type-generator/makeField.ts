import {
    DataTypeFields, DeprecatedFieldType, FieldType, GeoShapeType
} from '@terascope/types';
import { formatDateValue } from '@terascope/core-utils';
import { toCIDR } from '@terascope/ip-utils';
import { Chance } from 'chance';
import { randomPoint, randomPolygon } from '@turf/random';
// import { faker, Faker } from '@faker-js/faker';
import Randexp from 'randexp';
import { DataTypeConfigWithGeneratorOpts } from '../modes/data-type';

const chance = new Chance();

/**
 * - - - - - - - - - - - - - - - - - -
 * NOTE -
 * WILL REPLACE THIS FILE W/AN IMPORT FROM
 * TERASLICE BEFORE MERGING
 * - - - - - - - - - - - - - - - - - -
 */

/**
 * Returns a function that can be called to create a data type field
 * NOTE: implement "locale" if needed
 */
export function makeRandomDataFunctionForField(
    config: DataTypeConfigWithGeneratorOpts['fields']['config'],
    field: string,
    childConfig?: DataTypeFields// DataTypeFieldConfig
): () => any {
    const {
        type, array, dimension: vectorSize = 4,
        ...opts
    } = config;

    if (config.locale) {
        console.error(`Locale may not be supported`);
    }
    if (config.format && config.type !== FieldType.Date) {
        console.error(`Format currently only supported for date fields`);
    }

    if (opts.customize?.fn) {
        if (opts.randomExpression) console.error('Cannot use random');
        const fn = opts.customize.fn;
        return () => fn();
    }

    if (opts.customize?.randomExpression) {
        if (isNonStringFieldType(type)) {
            console.error(`Ensure your field config should have a random expression, received non-string type "${type}" for field "${field}"`);
        }
        const randExp = opts.customize.randomExpression;
        const prefix = opts.customize.randomExpressionPrefix || '';
        return () => `${prefix}${new Randexp(randExp).gen()}`;
    }

    // NOTE: arrow fn to avoid losing chance binding
    const dataFnForFieldType: Record<FieldType, () => any> = {
        [FieldType.Any]: () => chance.pickone([
            chance.word(),
            chance.bool(),
            { animal: chance.animal(), name: chance.name() }
        ]),
        [FieldType.Binary]: () => Buffer.from(chance.word()), // base64
        [FieldType.Boolean]: () => chance.bool(),
        [FieldType.Boundary]: () => createPolygon(config),
        [FieldType.Byte]: () => chance.integer({
            min: opts.min ?? -128,
            max: opts.max ?? 127
        }),
        [FieldType.Date]: () => { // fix more opts
            const date = chance.birthday();
            if (config.format) {
                return formatDateValue(date, config.format);
            }
            return date.toISOString();
        },
        [FieldType.Domain]: () => chance.domain(),
        [FieldType.Double]: () => createFloat(config), // 64-bit IEEE 754 finite
        [FieldType.Float]: () => createFloat(config), // 32-bit IEEE 754 finite
        [FieldType.Geo]: () => createGeoPoint(config),
        [FieldType.GeoJSON]: () => createGeoJSON(config),
        [FieldType.GeoPoint]: () => createGeoPoint(config),
        [FieldType.Hostname]: () => chance.word(),
        [FieldType.IP]: () => {
            if (opts.ipType === 'v6') return chance.ipv6();
            if (opts.ipType === 'v4') return chance.ip();
            return chance.pickone([
                chance.ip(),
                chance.ipv6(),
                '::0.0.0.1',
                '::1',
            ]);
        },
        [FieldType.IPRange]: () => {
            if (opts.ipType === 'v6') return toCIDR(chance.ipv6(), 128);
            if (opts.ipType === 'v4') return toCIDR(chance.ip(), 32);
            return chance.pickone([
                toCIDR(chance.ip(), 32),
                toCIDR(chance.ipv6(), 128),
                '::1/128',
            ]);
        },
        [FieldType.Integer]: () => ( // -2^31 to 2^31 - 1
            chance.integer({
                min: opts.min,
                max: opts.max
            })
        ),
        [FieldType.Keyword]: () => chance.word(),
        [FieldType.KeywordCaseInsensitive]: () => chance.word(),
        [FieldType.KeywordPathAnalyzer]: () => chance.word(),
        [FieldType.KeywordTokens]: () => chance.word(),
        [FieldType.KeywordTokensCaseInsensitive]: () => chance.word(),
        [FieldType.Long]: () => ( // -2^63 to 2^63 - 1
            chance.integer({
                min: opts.min,
                max: opts.max
            })
        ),
        [FieldType.NgramTokens]: () => `${chance.letter()}${chance.letter()}`,
        [FieldType.Number]: () => createFloat(config),
        [FieldType.Object]: () => {
            if (childConfig) {
                const obj: Record<string, string | number> = {};
                for (const key in childConfig) {
                    if (!Object.hasOwn(childConfig, key)) continue;
                    obj[key] = makeRandomDataFunctionForField(childConfig[key], key)();
                }
                return obj;
            } else {
                return chance.pickone([
                    {
                        city: chance.city(),
                        state: chance.state(),
                        zip: chance.zip()
                    },
                    {
                        first: chance.first(),
                        last: chance.last(),
                        age: chance.age()
                    },
                    {
                        hour: chance.hour(),
                        minute: chance.minute(),
                        second: chance.second()
                    }
                ]);
            }
        },
        [FieldType.Short]: () => chance.integer({
            min: opts.min || -32768,
            max: opts.max || 32768
        }),
        [FieldType.String]: () => chance.word(),
        [FieldType.Text]: () => chance.word(),
        [FieldType.Tuple]: () => ([
            chance.name(),
            chance.age(),
            chance.address()
        ]),
        [FieldType.Vector]: () => {
            const vectors: number[] = [];
            for (let i = 0; i < (vectorSize as number); i++) {
                vectors.push(
                    chance.floating({
                        min: opts.min || 0,
                        max: opts.max || 40,
                        fixed: opts.precision || 2
                    })
                );
            }
            return vectors;
        }
    };

    let fn = dataFnForFieldType[type];
    if (!fn) return () => 'UNKNOWN';

    const isNumber = isNumericFieldType(config.type);
    const isText = isTextFieldType(config.type);

    // addresses see if can get match city/state/zip if theres another field
    if (isText) {
        const things: (keyof Chance.Chance)[] = [
            'first',
            'last',
            // NAME - if no first/last
            'name',
            // try keep alphabetical except for name/hash
            'address',
            'animal',
            'areacode',
            'avatar',
            'city',
            'color',
            'company',
            'coordinates',
            'email',
            'gender',
            'hashtag',
            // HASH - if no hashtag
            'hash',
            'locale',
            'month',
            'phone',
            'profession',
            'prefix',
            'province',
            'radio',
            'state',
            'suffix',
            'ssn',
            'tv',
            'twitter',
            'url',
            'weekday',
            'year',
            'zip',
        ];
        // const fakerFoods = [
        //     'meat',
        //     'vegetable',
        //     'spice',
        //     'ingredient',
        //     'food',
        //     'airline',
        //     'airplane',
        //     'airport',
        //     'flightNumber',
        //     'album',
        //     'artist',
        //     'songName',
        //     'genre'
        // ];

        const found = things.find((thing) => field.includes(thing));
        if (found) {
            fn = () => (chance[found] as (opts?: any) => any)();
        } else {
            if (field.includes('country')) {
                fn = () => chance.country(field.includes('code')
                    ? undefined
                    : { full: true });
            }
            if (field === 'cost' || field === 'amount') {
                fn = () => chance.dollar();
            }
            if (field.includes('credit')) {
                fn = () => chance.cc_type();
            }
            if (field.includes('description')) {
                fn = () => chance.paragraph();
            }
            if (field.includes('job')) {
                fn = () => chance.profession();
            }
            if (['key', '_key', 'id', '_id', 'uuid', 'guid'].includes(field)) {
                fn = () => chance.guid();
            }
            if (field.includes('timezone')) {
                fn = () => (chance.timezone().name);
            }
        }
    }
    if (isNumber) {
        const things: (keyof Chance.Chance)[] = [
            'age',
            'altitude',
            'depth',
            'hour',
            'latitude',
            'longitude',
            'millisecond',
            'minute',
            'second',
            'timestamp'
        ];
        const found = things.find((thing) => field.includes(thing));
        if (found) {
            fn = (chance[found] as (opts?: any) => any);
        } else {
            if (field.includes('year')) {
                fn = () => Number(chance.year());
            }
        }
    }

    if (array && type !== FieldType.Vector) {
        return () => {
            const count = chance.integer({ max: opts.min || 10, min: opts.max || 1 });
            const results: any[] = [];
            for (let i = 0; i < count; i++) {
                results.push(fn());
            }
            return results;
        };
    }
    return fn;
}

function createPolygon(opts: DataTypeConfigWithGeneratorOpts['fields']['config']) {
    console.error('===createPoly');
    const { geometryCount, boundingBox, maxRadius, vertices } = opts.geo || {};

    const coordinates = randomPolygon(
        geometryCount, {
            bbox: boundingBox,
            max_radial_length: maxRadius,
            num_vertices: vertices
        }
    ).features[0].geometry.coordinates;

    return coordinates.map((el) => {
        const [lon, lat] = el;
        return { lat, lon };
    });
}

function createGeoPoint(opts: DataTypeConfigWithGeneratorOpts['fields']['config']) {
    const point = randomPoint(opts.geo?.geometryCount, { bbox: opts.geo?.boundingBox });
    const [longitude, latitude] = point.features[0].geometry.coordinates;
    return { latitude, longitude };
}

// fixme intersects / x% within box / x% outside
function createGeoJSON(opts: DataTypeConfigWithGeneratorOpts['fields']['config']) {
    const {
        geometryCount, boundingBox, vertices, maxRadius
    } = opts.geo || {};

    const geoType = opts.geo?.type || chance.pickone(Object.values(GeoShapeType));

    const polygonOpts = {
        bbox: boundingBox,
        max_radial_length: maxRadius,
        num_vertices: vertices
    };

    if (geoType === GeoShapeType.Point) {
        return randomPoint(geometryCount, { bbox: boundingBox }).features[0].geometry;
    }

    if (geoType === GeoShapeType.Polygon) {
        return randomPolygon(geometryCount, polygonOpts).features[0].geometry;
    }

    const numPolygons = geometryCount || chance.integer({
        max: opts.max || 5,
        min: opts.min || 1
    });
    const polygons = randomPolygon(numPolygons, polygonOpts);

    const multiCoords: any[][] = [];
    polygons.features.forEach((feat) => {
        multiCoords.push(feat.geometry.coordinates);
    });

    return {
        type: GeoShapeType.MultiPolygon,
        coordinates: multiCoords
    };
}

function createFloat(opts: DataTypeConfigWithGeneratorOpts['fields']['config']) {
    return chance.floating({
        min: opts.min,
        max: opts.max,
        fixed: opts.precision
    });
}

function isNonStringFieldType(type: FieldType | DeprecatedFieldType) {
    const nonTextFields: (FieldType | DeprecatedFieldType)[] = [
        FieldType.Boolean,
        FieldType.Boundary,
        FieldType.Byte,
        FieldType.Double,
        FieldType.Float,
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Geo,
        FieldType.Integer,
        FieldType.Long,
        FieldType.Number,
        FieldType.Object,
        FieldType.Short,
        FieldType.Tuple,
        FieldType.Vector
    ];
    return nonTextFields.includes(type);
}

function isNumericFieldType(type: FieldType | DeprecatedFieldType) {
    const numericTypes: (FieldType | DeprecatedFieldType)[] = [
        FieldType.Short,
        FieldType.Number,
        FieldType.Long,
        FieldType.Float,
        FieldType.Integer,
        FieldType.Double,
        FieldType.Byte
    ];
    return numericTypes.includes(type);
}

function isTextFieldType(type: FieldType | DeprecatedFieldType) {
    const numericTypes: (FieldType | DeprecatedFieldType)[] = [
        FieldType.Text,
        FieldType.String,
        FieldType.Keyword,
        FieldType.KeywordCaseInsensitive,
        FieldType.KeywordPathAnalyzer,
        FieldType.KeywordTokens,
        FieldType.KeywordTokensCaseInsensitive,
    ];
    return numericTypes.includes(type);
}
