import 'jest-extended';
import { jest } from '@jest/globals';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('flatten_object should', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

    beforeEach(() => {
        data = [
            {
                id: 1,
                location: { city: 'Portland', geo: { lat: 45.5, lon: -122.6 } }
            },
            {
                id: 2,
                location: { city: 'Seattle', geo: { lat: 47.6, lon: -122.3 } }
            }
        ];
    });

    async function makeTest(config: Partial<OpConfig> = {}) {
        const opConfig: OpConfig = Object.assign({}, { _op: 'flatten_object' }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('generate an empty result if no input data', async () => {
        const test = await makeTest();
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    describe('with no field configured', () => {
        it('flatten nested objects into delimiter joined keys', async () => {
            const test = await makeTest();
            const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    'location.city': 'Portland',
                    'location.geo.lat': 45.5,
                    'location.geo.lon': -122.6
                },
                {
                    id: 2,
                    'location.city': 'Seattle',
                    'location.geo.lat': 47.6,
                    'location.geo.lon': -122.3
                }
            ]);
        });

        it('leave a record with no nested objects untouched', async () => {
            const test = await makeTest();
            const results = await test.runSlice([{ id: 1, name: 'joe' }]) as DataEntity[];

            expect(results).toEqual([{ id: 1, name: 'joe' }]);
        });

        it('copy arrays over as a value without descending into them', async () => {
            const test = await makeTest();
            const results = await test.runSlice([
                { a: { b: [1, 2] }, c: [{ d: 1 }] }
            ]) as DataEntity[];

            expect(results).toEqual([{ 'a.b': [1, 2], c: [{ d: 1 }] }]);
        });

        it('keep an empty object as a value', async () => {
            const test = await makeTest();
            const results = await test.runSlice([{ a: {}, b: { c: {} } }]) as DataEntity[];

            expect(results).toEqual([{ a: {}, 'b.c': {} }]);
        });

        it('keep null and undefined as leaf values', async () => {
            const test = await makeTest();
            const results = await test.runSlice([
                { a: null, b: { c: null, d: undefined } }
            ]) as DataEntity[];

            // toEqual ignores undefined values, so assert the key survived too
            expect(Object.keys(results[0])).toEqual(['a', 'b.c', 'b.d']);
            expect(results).toEqual([{ a: null, 'b.c': null, 'b.d': undefined }]);
        });

        it('keep anything that is not a plain object as a leaf value', async () => {
            class Point {
                constructor(public x = 1) {}
            }

            const values = {
                date: new Date('2024-01-01T00:00:00.000Z'),
                regex: /abc/,
                map: new Map([['k', 1]]),
                set: new Set([1]),
                buffer: Buffer.from('hi'),
                instance: new Point(),
                entity: DataEntity.make({ inner: { deep: 1 } })
            };

            const test = await makeTest();
            const results = await test.runSlice([
                Object.fromEntries(
                    Object.entries(values).map(([name, value]) => [name, { v: value }])
                )
            ]) as DataEntity[];

            expect(Object.keys(results[0])).toEqual(
                Object.keys(values).map((name) => `${name}.v`)
            );
            expect(results[0]['entity.v']).toEqual({ inner: { deep: 1 } });
        });

        it('use a custom delimiter', async () => {
            const test = await makeTest({ delimiter: '_' });
            const results = await test.runSlice([
                { location: { city: 'Portland' } }
            ]) as DataEntity[];

            expect(results).toEqual([{ location_city: 'Portland' }]);
        });

        it('count max_depth from the record root', async () => {
            const test = await makeTest({ max_depth: 1 });
            const results = await test.runSlice([{ a: { b: { c: 1 } } }]) as DataEntity[];

            expect(results).toEqual([{ 'a.b': { c: 1 } }]);
        });

        it('fully flatten when max_depth is deeper than the record', async () => {
            const test = await makeTest({ max_depth: 10 });
            const results = await test.runSlice([{ a: { b: { c: 1 } } }]) as DataEntity[];

            expect(results).toEqual([{ 'a.b.c': 1 }]);
        });

        it('treat an explicit null field the same as leaving it out', async () => {
            const test = await makeTest({ field: null });
            const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    'location.city': 'Portland',
                    'location.geo.lat': 45.5,
                    'location.geo.lon': -122.6
                },
                {
                    id: 2,
                    'location.city': 'Seattle',
                    'location.geo.lat': 47.6,
                    'location.geo.lon': -122.3
                }
            ]);
        });

        it('preserve the metadata of the record', async () => {
            const test = await makeTest();
            const input = DataEntity.make({ a: { b: 1 } }, { _key: 'foo' });
            const results = await test.runSlice([input]) as DataEntity[];

            expect(results[0].getMetadata('_key')).toBe('foo');
            expect(results[0]).toEqual({ 'a.b': 1 });
        });

        it('flatten a nested "__proto__" key without polluting the prototype', async () => {
            const test = await makeTest();
            // an object literal cannot hold an own "__proto__" key, JSON.parse can
            const doc = JSON.parse('{"a": {"__proto__": {"polluted": true}}}');
            const results = await test.runSlice([doc]) as DataEntity[];

            expect(Object.keys(results[0])).toEqual(['a.__proto__.polluted']);
            expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        });

        it('flatten the records of a DataWindow', async () => {
            const test = await makeTest();
            const results = await test.runSlice([
                DataWindow.make('window_key', cloneDeep(data))
            ]) as DataWindow[];

            expect(results).toBeArrayOfSize(1);
            expect(results[0].asArray()).toEqual([
                {
                    id: 1,
                    'location.city': 'Portland',
                    'location.geo.lat': 45.5,
                    'location.geo.lon': -122.6
                },
                {
                    id: 2,
                    'location.city': 'Seattle',
                    'location.geo.lat': 47.6,
                    'location.geo.lon': -122.3
                }
            ]);
        });

        it('preserve the key of a DataWindow and of the records inside it', async () => {
            const test = await makeTest();
            const window = DataWindow.make('window_key', [
                DataEntity.make({ a: { b: 1 } }, { _key: 'inner' })
            ]);
            const results = await test.runSlice([window]) as DataWindow[];

            expect(results[0].getMetadata('_key')).toBe('window_key');
            expect(results[0].asArray()[0].getMetadata('_key')).toBe('inner');
        });
    });

    describe('with a list of fields', () => {
        it('accept a single field as a bare string', async () => {
            const test = await makeTest({ field: 'location.geo' });
            const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    location: { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 }
                },
                {
                    id: 2,
                    location: { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
                }
            ]);
        });

        it('flatten only the listed top level field', async () => {
            const test = await makeTest({ field: ['location'] });
            const results = await test.runSlice([
                { id: 1, location: { city: 'Portland', geo: { lat: 45.5 } }, other: { a: 1 } }
            ]) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    'location.city': 'Portland',
                    'location.geo.lat': 45.5,
                    other: { a: 1 }
                }
            ]);
        });

        it('reach a nested field through dot notation without flattening its parent', async () => {
            const test = await makeTest({ field: ['location.geo'] });
            const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    location: { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 }
                },
                {
                    id: 2,
                    location: { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
                }
            ]);
        });

        it('keep a deeply nested parent intact while flattening the target', async () => {
            const test = await makeTest({ field: ['a.b.c'] });
            const results = await test.runSlice([
                { a: { b: { c: { d: { e: 1 } }, keep: { me: 2 } } } }
            ]) as DataEntity[];

            expect(results).toEqual([
                { a: { b: { 'c.d.e': 1, keep: { me: 2 } } } }
            ]);
        });

        it('flatten several fields independently', async () => {
            const test = await makeTest({ field: ['location.geo', 'meta'] });
            const results = await test.runSlice([
                {
                    id: 1,
                    location: { city: 'Portland', geo: { lat: 45.5 } },
                    meta: { source: { name: 'x' } }
                }
            ]) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    location: { city: 'Portland', 'geo.lat': 45.5 },
                    'meta.source.name': 'x'
                }
            ]);
        });

        it('count max_depth from each field rather than the record root', async () => {
            const test = await makeTest({ field: ['a.b'], max_depth: 1 });
            const results = await test.runSlice([
                { a: { b: { c: { d: 1 } } } }
            ]) as DataEntity[];

            // depth restarts at b, so b.c is reached but d stays nested
            expect(results).toEqual([{ a: { 'b.c': { d: 1 } } }]);
        });

        it('use a custom delimiter on the flattened keys but dots on the path', async () => {
            const test = await makeTest({ field: ['location.geo'], delimiter: '_' });
            const results = await test.runSlice([
                { location: { city: 'Portland', geo: { coords: { lat: 45.5 } } } }
            ]) as DataEntity[];

            expect(results).toEqual([
                { location: { city: 'Portland', geo_coords_lat: 45.5 } }
            ]);
        });

        it('leave the record alone when the field is already a leaf value', async () => {
            const test = await makeTest({ field: ['a'] });
            const results = await test.runSlice([{ a: 1, b: { c: 2 } }]) as DataEntity[];

            expect(results).toEqual([{ a: 1, b: { c: 2 } }]);
        });

        it('overwrite a key that the flattened one collides with', async () => {
            const test = await makeTest({ field: ['a'] });
            const results = await test.runSlice([
                { a: { b: 1 }, 'a.b': 'existing' }
            ]) as DataEntity[];

            expect(results).toEqual([{ 'a.b': 1 }]);
        });

        it('flatten the listed fields of a DataWindow', async () => {
            const test = await makeTest({ field: ['location.geo'] });
            const results = await test.runSlice([
                DataWindow.make('window_key', cloneDeep(data))
            ]) as DataWindow[];

            expect(results).toBeArrayOfSize(1);
            expect(results[0].asArray()).toEqual([
                {
                    id: 1,
                    location: { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 }
                },
                {
                    id: 2,
                    location: { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
                }
            ]);
        });
    });

    describe('with flatten_arrays on', () => {
        it('descend into arrays using the index as a key segment', async () => {
            const test = await makeTest({ flatten_arrays: true });
            const results = await test.runSlice([
                { a: { b: [1, 2] }, c: [{ d: 1 }] }
            ]) as DataEntity[];

            expect(results).toEqual([
                { 'a.b.0': 1, 'a.b.1': 2, 'c.0.d': 1 }
            ]);
        });

        it('flatten an array of objects at the top level', async () => {
            const test = await makeTest({ flatten_arrays: true });
            const results = await test.runSlice(cloneDeep([
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', geo: { lat: 45.5 } },
                        { city: 'Seattle', geo: { lat: 47.6 } }
                    ]
                }
            ])) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    'locations.0.city': 'Portland',
                    'locations.0.geo.lat': 45.5,
                    'locations.1.city': 'Seattle',
                    'locations.1.geo.lat': 47.6
                }
            ]);
        });

        it('descend into nested arrays', async () => {
            const test = await makeTest({ flatten_arrays: true });
            const results = await test.runSlice([{ a: [[1, 2], [3]] }]) as DataEntity[];

            expect(results).toEqual([
                { 'a.0.0': 1, 'a.0.1': 2, 'a.1.0': 3 }
            ]);
        });

        it('keep an empty array as a value', async () => {
            const test = await makeTest({ flatten_arrays: true });
            const results = await test.runSlice([{ a: [], b: { c: [] } }]) as DataEntity[];

            expect(results).toEqual([{ a: [], 'b.c': [] }]);
        });

        it('use the custom delimiter on index segments', async () => {
            const test = await makeTest({ flatten_arrays: true, delimiter: '_' });
            const results = await test.runSlice([{ a: [{ b: 1 }] }]) as DataEntity[];

            expect(results).toEqual([{ a_0_b: 1 }]);
        });

        it('count an array level against max_depth', async () => {
            const test = await makeTest({ flatten_arrays: true, max_depth: 1 });
            const results = await test.runSlice([{ a: [{ b: 1 }] }]) as DataEntity[];

            expect(results).toEqual([{ 'a.0': { b: 1 } }]);
        });

        it('flatten an array named by field', async () => {
            const test = await makeTest({ field: 'locations', flatten_arrays: true });
            const results = await test.runSlice(cloneDeep([
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', geo: { lat: 45.5 } },
                        { city: 'Seattle', geo: { lat: 47.6 } }
                    ],
                    other: { a: 1 }
                }
            ])) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    'locations.0.city': 'Portland',
                    'locations.0.geo.lat': 45.5,
                    'locations.1.city': 'Seattle',
                    'locations.1.geo.lat': 47.6,
                    other: { a: 1 }
                }
            ]);
        });

        it('leave an array named by field alone when the flag is off', async () => {
            const test = await makeTest({ field: 'locations' });
            const results = await test.runSlice([
                { locations: [{ city: 'Portland' }] }
            ]) as DataEntity[];

            expect(results).toEqual([{ locations: [{ city: 'Portland' }] }]);
        });

        it('still work with a wildcard path', async () => {
            const test = await makeTest({ field: 'locations.*.tags', flatten_arrays: true });
            const results = await test.runSlice([
                {
                    locations: [
                        { city: 'Portland', tags: ['a', 'b'] },
                        { city: 'Seattle', tags: ['c'] }
                    ]
                }
            ]) as DataEntity[];

            expect(results).toEqual([
                {
                    locations: [
                        { city: 'Portland', 'tags.0': 'a', 'tags.1': 'b' },
                        { city: 'Seattle', 'tags.0': 'c' }
                    ]
                }
            ]);
        });
    });

    describe('with a wildcard in the path', () => {
        let locations: Record<string, any>[];

        beforeEach(() => {
            locations = [
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', geo: { lat: 45.5, lon: -122.6 } },
                        { city: 'Seattle', geo: { lat: 47.6, lon: -122.3 } }
                    ]
                }
            ];
        });

        it('flatten the field in every element of an array', async () => {
            const test = await makeTest({ field: 'locations.*.geo' });
            const results = await test.runSlice(cloneDeep(locations)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 },
                        { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
                    ]
                }
            ]);
        });

        it('accept the [] bracket form', async () => {
            const test = await makeTest({ field: 'locations[].geo' });
            const results = await test.runSlice(cloneDeep(locations)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 },
                        { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
                    ]
                }
            ]);
        });

        it('accept the [*] bracket form', async () => {
            const test = await makeTest({ field: 'locations[*].geo' });
            const results = await test.runSlice(cloneDeep(locations)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 },
                        { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
                    ]
                }
            ]);
        });

        it('still target a single element with a numeric index', async () => {
            const test = await makeTest({ field: 'locations[0].geo' });
            const results = await test.runSlice(cloneDeep(locations)) as DataEntity[];

            expect(results).toEqual([
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 },
                        { city: 'Seattle', geo: { lat: 47.6, lon: -122.3 } }
                    ]
                }
            ]);
        });

        it('fan out across the values of an object', async () => {
            const test = await makeTest({ field: 'people.*.geo' });
            const results = await test.runSlice([
                {
                    people: {
                        joe: { geo: { lat: 45.5 } },
                        moe: { geo: { lat: 47.6 } }
                    }
                }
            ]) as DataEntity[];

            expect(results).toEqual([
                {
                    people: {
                        joe: { 'geo.lat': 45.5 },
                        moe: { 'geo.lat': 47.6 }
                    }
                }
            ]);
        });

        it('handle more than one wildcard in a path', async () => {
            const test = await makeTest({ field: 'a.*.b.*.c' });
            const results = await test.runSlice([
                {
                    a: [
                        { b: [{ c: { d: 1 } }, { c: { d: 2 } }] },
                        { b: [{ c: { d: 3 } }] }
                    ]
                }
            ]) as DataEntity[];

            expect(results).toEqual([
                {
                    a: [
                        { b: [{ 'c.d': 1 }, { 'c.d': 2 }] },
                        { b: [{ 'c.d': 3 }] }
                    ]
                }
            ]);
        });

        it('skip elements that do not have the field', async () => {
            const test = await makeTest({ field: 'locations.*.geo' });
            const results = await test.runSlice([
                {
                    locations: [
                        { city: 'Portland', geo: { lat: 45.5 } },
                        { city: 'Boise' }
                    ]
                }
            ]) as DataEntity[];

            expect(results).toEqual([
                {
                    locations: [
                        { city: 'Portland', 'geo.lat': 45.5 },
                        { city: 'Boise' }
                    ]
                }
            ]);
        });

        it('not report missing when at least one element matched', async () => {
            const test = await makeTest({
                field: 'locations.*.geo',
                missing_field_action: 'throw'
            });

            await expect(test.runSlice([
                {
                    locations: [
                        { city: 'Portland', geo: { lat: 45.5 } },
                        { city: 'Boise' }
                    ]
                }
            ])).toResolve();
        });

        it('report missing when no element matched', async () => {
            const test = await makeTest({
                field: 'locations.*.geo',
                missing_field_action: 'throw'
            });

            await expect(test.runSlice([
                { locations: [{ city: 'Boise' }] }
            ])).toReject();
        });

        it('report missing when the array is empty', async () => {
            const test = await makeTest({
                field: 'locations.*.geo',
                missing_field_action: 'throw'
            });

            await expect(test.runSlice([{ locations: [] }])).toReject();
        });

        it('apply max_depth to each matched field', async () => {
            const test = await makeTest({ field: 'locations.*.geo', max_depth: 1 });
            const results = await test.runSlice([
                {
                    locations: [
                        { geo: { coords: { lat: 45.5 } } },
                        { geo: { coords: { lat: 47.6 } } }
                    ]
                }
            ]) as DataEntity[];

            expect(results).toEqual([
                {
                    locations: [
                        { 'geo.coords': { lat: 45.5 } },
                        { 'geo.coords': { lat: 47.6 } }
                    ]
                }
            ]);
        });

        it('flatten a wildcard field inside a DataWindow', async () => {
            const test = await makeTest({ field: 'locations.*.geo' });
            const results = await test.runSlice([
                DataWindow.make('window_key', cloneDeep(locations))
            ]) as DataWindow[];

            expect(results[0].asArray()).toEqual([
                {
                    id: 1,
                    locations: [
                        { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 },
                        { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
                    ]
                }
            ]);
        });
    });

    describe('when a listed field is missing', () => {
        it('ignore it by default', async () => {
            const test = await makeTest({ field: ['nope', 'a.b.nope'] });
            const results = await test.runSlice([{ id: 1, a: { b: { c: 1 } } }]) as DataEntity[];

            expect(results).toEqual([{ id: 1, a: { b: { c: 1 } } }]);
        });

        it('still flatten the fields that are present', async () => {
            const test = await makeTest({ field: ['nope', 'location.geo'] });
            const results = await test.runSlice([
                { location: { city: 'Portland', geo: { lat: 45.5 } } }
            ]) as DataEntity[];

            expect(results).toEqual([
                { location: { city: 'Portland', 'geo.lat': 45.5 } }
            ]);
        });

        it('log a warning when missing_field_action is log', async () => {
            const test = await makeTest({
                field: ['nope'],
                missing_field_action: 'log'
            });

            const warn = jest.spyOn(test.getOperation('flatten_object').logger, 'warn');
            const results = await test.runSlice([{ id: 1 }]) as DataEntity[];

            expect(results).toEqual([{ id: 1 }]);
            expect(warn).toHaveBeenCalledWith('Field "nope" not found on record');
        });

        it('throw when missing_field_action is throw', async () => {
            const test = await makeTest({
                field: ['nope'],
                missing_field_action: 'throw'
            });

            await expect(test.runSlice([{ id: 1 }])).toReject();
        });

        it('throw when the parent of the field is missing', async () => {
            const test = await makeTest({
                field: ['location.geo'],
                missing_field_action: 'throw'
            });

            await expect(test.runSlice([{ id: 1 }])).toReject();
        });

        it('treat a field holding null as found', async () => {
            const test = await makeTest({
                field: ['a'],
                missing_field_action: 'throw'
            });

            await expect(test.runSlice([{ a: null }])).toResolve();
        });

        it('not count an inherited DataEntity method as found', async () => {
            const test = await makeTest({
                field: ['getMetadata'],
                missing_field_action: 'throw'
            });

            await expect(test.runSlice([{ id: 1 }])).toReject();
        });

        it('log a warning once per record for a wildcard path that matched nothing', async () => {
            const test = await makeTest({
                field: ['locations.*.geo'],
                missing_field_action: 'log'
            });

            const warn = jest.spyOn(test.getOperation('flatten_object').logger, 'warn');
            const results = await test.runSlice([
                { locations: [{ city: 'Boise' }] },
                { locations: [{ city: 'Portland', geo: { lat: 45.5 } }] }
            ]) as DataEntity[];

            expect(results).toEqual([
                { locations: [{ city: 'Boise' }] },
                { locations: [{ city: 'Portland', 'geo.lat': 45.5 }] }
            ]);
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn).toHaveBeenCalledWith('Field "locations.*.geo" not found on record');
        });
    });
});
