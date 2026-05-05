import {
    DataTypeFields, DataTypeFieldConfig, FieldType, GeoShapeType
} from '@terascope/types';
import { formatDateValue, hasOwn, isEmpty } from '@terascope/core-utils';
import { toCIDR } from '@terascope/ip-utils';
import { Chance } from 'chance';
import { randomPoint, randomPolygon } from '@turf/random';
import { faker, Faker } from '@faker-js/faker';

const chance = new Chance();

/**
 * - - - - - - - - - - - - - - - - - -
 * NOTE -
 * WILL REPLACE THIS FILE W/AN IMPORT FROM
 * TERASLICE BEFORE MERGING
 *
 * FIXME - if is rand exp use randexp
 * // something for temperatures maybe - c or f - looks like just float - maybe add options
 * - - - - - - - - - - - - - - - - - -
 */
type Options = {
    // numbers
    min?: number;
    max?: number;
    precision?: number;
    // words
    wordType?: Faker['word'];
    // ip
    ipv6?: boolean;

};
/**
 * Returns a function that can be called to create a data type field
 * NOTE: implement "locale" if needed
 */
export function makeRandomDataFunctionForField(
    config: DataTypeFieldConfig & { options?: Options }, field: string
): () => any {
    const { type, array, dimension: vectorSize = 4, options } = config;
    const opts = options || {};

    if (config.locale) {
        console.error(`Locale may not be supported`);
    }
    if (config.format && config.type !== FieldType.Date) {
        console.error(`Format currently only supported for date fields`);
    }

    // NOTE: arrow fn to avoid losing chance binding
    const dataFnForFieldType: Record<FieldType, () => any> = {
        [FieldType.Any]: () => chance.pickone([
            chance.word(),
            chance.bool(),
            { animal: chance.animal(), name: chance.name() }
        ]),
        // @ts-expect-error
        [FieldType.Binary]: () => Buffer.from(chance.word()), // base64
        [FieldType.Boolean]: () => chance.bool(),
        [FieldType.Boundary]: () => {
            const polygon = randomPolygon().features[0].geometry.coordinates;
            return polygon.map((el) => {
                const [lon, lat] = el;
                return { lat, lon };
            });
        },
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
        [FieldType.Double]: () => ( // 64-bit IEEE 754 finite
            chance.floating({
                min: opts.min,
                max: opts.max,
                fixed: opts.precision
            })
        ),
        [FieldType.Float]: () => ( // 32-bit IEEE 754 finite
            chance.floating({
                min: opts.min,
                max: opts.max,
                fixed: opts.precision
            })
        ),
        [FieldType.Geo]: () => { // fixme if distance maybe
            const [longitude, latitude] = randomPoint().features[0].geometry.coordinates;
            return { latitude, longitude };
        },
        [FieldType.GeoJSON]: () => { // fixme intersects / x% within box / x% outside
            const geoType = chance.pickone([
                GeoShapeType.MultiPolygon,
                GeoShapeType.Point,
                GeoShapeType.Polygon
            ]);

            if (geoType === GeoShapeType.Point) {
                return randomPoint().features[0].geometry;
            }

            if (geoType === GeoShapeType.Polygon) {
                return randomPolygon().features[0].geometry;
            }

            const numPolygons = chance.integer({
                max: opts.max || 5,
                min: opts.min || 1
            });
            const polygons = randomPolygon(numPolygons);

            const multiCoords: any[][] = [];
            polygons.features.forEach((feat) => {
                multiCoords.push(feat.geometry.coordinates);
            });

            return {
                type: GeoShapeType.MultiPolygon,
                coordinates: multiCoords
            };
        },
        [FieldType.GeoPoint]: () => {
            const [longitude, latitude] = randomPoint().features[0].geometry.coordinates;
            return { latitude, longitude };
        },
        [FieldType.Hostname]: () => chance.word(),
        [FieldType.IP]: () => {
            if (opts.ipv6) return chance.ipv6();
            return chance.pickone([
                chance.ip(),
                chance.ipv6(),
                '::0.0.0.1',
                '::1',
            ]);
        },
        [FieldType.IPRange]: () => {
            if (opts.ipv6) return chance.ipv6();
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
        [FieldType.Number]: () => chance.floating({
            min: opts.min,
            max: opts.max,
            fixed: opts.precision
        }),
        [FieldType.Object]: () => ({
            // look for . gather keys / etc.
            city: chance.city(),
            state: chance.state(),
            zip: chance.zip()
        }),
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

    const isNumber = [
        FieldType.Short,
        FieldType.Number,
        FieldType.Long,
        FieldType.Float,
        FieldType.Integer,
        FieldType.Double,
        FieldType.Byte
    ].includes(config.type as FieldType);

    const isText = [
        FieldType.Text,
        FieldType.String,
        FieldType.Keyword,
        FieldType.KeywordCaseInsensitive,
        FieldType.KeywordPathAnalyzer,
        FieldType.KeywordTokens,
        FieldType.KeywordTokensCaseInsensitive,
    ].includes(config.type as FieldType);

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

/**
 * Generates an array of records based on the data type field config of count
 * NOTE: "locale" not implemented
 */
export function makeRandomDataSet(
    fields: DataTypeFields,
    total = 3,
    isStressTest = false
): Record<string, any>[] | undefined {
    if (isEmpty(fields)) return;

    const fns: Record<string, () => any> = {};

    for (const field in fields) {
        if (hasOwn(fields, field)) {
            const config = fields[field];
            fns[field] = makeRandomDataFunctionForField(config, field);
        }
    }

    const makeField = () => {
        const record: any = {};
        for (const key in fns) {
            if (!Object.hasOwn(fns, key)) continue;
            record[key] = fns[key]();
        }
        return record;
    };

    const stressTestRecord = isStressTest
        ? makeField()
        : undefined;

    const records: Record<string, any>[] = [];
    for (let i = 0; i < total; i++) {
        records.push(stressTestRecord || makeField());
    }

    return records;
}
