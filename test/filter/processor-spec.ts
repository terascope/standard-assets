import { WorkerTestHarness } from 'teraslice-test-harness';
import { cloneDeep } from '@terascope/job-components';
import { FilterConfig } from '../../asset/src/filter/interfaces.js';

const incoming = [
    {
        _key: 0,
        ip: '28.127.246.12',
        name: 'francis'
    },
    {
        _key: 1,
        ip: '28.127.246.232',
        name: 'joseph'
    },
    {
        _key: 2,
        ip: '28.127.246.244',
        name: 'Johnson'
    },
    {
        _key: 3,
        ip: '4.17.23.6',
        name: 'bob'
    },
    {
        _key: 4,
        ip: '4.17.14.18',
        name: 'greg'
    },
];

describe('filter', () => {
    let harness: WorkerTestHarness;
    let testData: any[];

    async function makeTest(config: Partial<FilterConfig> = {}) {
        const baseConfig = {
            _op: 'filter',
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    beforeEach(() => {
        testData = testData;
    })

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });


    it('should return empty array if input is an empty array', async () => {
        const harness = await makeTest({
            field: 'test',
            value: 'test',
            filter_by: 'match'
        });
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('should return docs without matching value', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: '28.127.246.232',
            filter_by: 'match'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toEqual(4);
    });

    it('should only return doc with matching field', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: '28.127.246.232',
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(1);
    });

    it('should return no docs if none match and invert is true', async () => {
        const testDocs = testData;
        testDocs[1].ip = '8.8.8.8';

        const harness = await makeTest({
            field: 'ip',
            value: '28.127.246.232',
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testDocs);

        expect(results.length).toBe(0);
    });

    it('should filter docs with value that match regex', async () => {
        const harness = await makeTest({
            field: 'name',
            value: '^jo.*',
            filter_by: 'regex',
            regex_flags: 'i'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(3);
    });

    it('should return docs with value that match regex if invert true and regex_flags to i to ignore case', async () => {
        const harness = await makeTest({
            field: 'name',
            value: '^jo.*',
            filter_by: 'regex',
            regex_flags: 'i'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(2);
    });

    it('should return docs with value that match regex if invert true and regex_args using the default', async () => {
        const harness = await makeTest({
            field: 'name',
            value: '^Jo.*',
            regex_flags: '',
            filter_by: 'regex',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results[0].name).toBe('Johnson');
        expect(results.length).toBe(1);
    });

    it('should return docs with an ip value not in the range', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: '28.127.246.0/26',
            filter_by: 'ip_range',
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(4);
    });

    it('should return docs with an ip value in the given range and invert is true', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: '28.127.246.0/26',
            filter_by: 'ip_range',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(1);
    });

    it('should return docs without matching values for an array of values', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: ['28.127.246.232', '4.17.14.18'],
            filter_by: 'match'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toEqual(3);
    });

    it('should return docs that match and arrary values if invert is true', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: ['28.127.246.232', '4.17.14.18'],
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toEqual(2);
    });

    it('should filter docs that match regex for an array of values', async () => {
        const harness = await makeTest({
            field: 'name',
            value: ['^jo.*', '^g.*'],
            filter_by: 'regex',
            regex_flags: 'i'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(2);
    });

    it('should filter docs that match regex for an array of values', async () => {
        const harness = await makeTest({
            field: 'name',
            value: ['^jo.*', '^g.*'],
            filter_by: 'regex',
            regex_flags: 'i',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(3);
    });

    it('should return docs with an ip value outside of all ranges of array of cidr values', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: ['28.127.246.0/26', '4.17.0.0/17'],
            filter_by: 'ip_range',
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(2);
    });

    it('should return docs with an ip value in any of the array of ip ranges and invert is true', async () => {
        const harness = await makeTest({
            field: 'ip',
            value: ['28.127.246.0/26', '4.17.0.0/16'],
            filter_by: 'ip_range',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(3);
    });

    it('should be able to filter array field values', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'bob',
            filter_by: 'match',
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(2);
        expect(results[0]._key).toBe(1);
        expect(results[1]._key).toBe(4);
    });

    it('should return everything if no match', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'grog',
            filter_by: 'match',
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(5);
    });

    it('should be able to keep array field values if invert is true', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'bob',
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(3);
        expect(results[0]._key).toBe(0);
        expect(results[1]._key).toBe(2);
        expect(results[2]._key).toBe(3);
    });

    it('should return empty array if no match and invert it true', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'grog',
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(0);
    });

    it('should be able to filter array field values', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'bob',
            filter_by: 'match',
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(2);
        expect(results[0]._key).toBe(1);
        expect(results[1]._key).toBe(4);
    });

    it('should return everything if no match', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'grog',
            filter_by: 'match',
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(5);
    });

    it('should be able to keep array field values if invert is true', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'bob',
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(3);
        expect(results[0]._key).toBe(0);
        expect(results[1]._key).toBe(2);
        expect(results[2]._key).toBe(3);
    });

    it('should return empty array if no match and invert it true', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'grog',
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(0);
    });

    it('should be able to filter values by array index', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];
        testData[3].name = ['foo', 'man', 'cow'];

        const harness = await makeTest({
            field: 'name',
            value: 'foo',
            array_index: 1,
            filter_by: 'match'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(4);
    });

    it('should return values if array_index matches and invert it true', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];
        testData[3].name = ['foo', 'man', 'cow'];

        const harness = await makeTest({
            field: 'name',
            value: 'foo',
            array_index: 0,
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(1);
        expect(results[0]._key).toBe(3);
    });

    it('should return all values if array_index does not match', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];
        testData[3].name = ['foo', 'man', 'cow'];

        const harness = await makeTest({
            field: 'name',
            value: 'foo',
            array_index: 2,
            filter_by: 'match'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(5);
    });

    it('should return empty array if array_index does not match and invert true', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];
        testData[3].name = ['foo', 'man', 'cow'];

        const harness = await makeTest({
            field: 'name',
            value: 'foo',
            array_index: 2,
            filter_by: 'match',
            invert: true
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(0);
    });

    it('should not throw an error if array_index is larger than array length', async () => {
        testData[0].name = ['bob', 'foo', 'man'];
        testData[2].name = ['herm', 'max', 'bob'];

        const harness = await makeTest({
            field: 'name',
            value: 'foo',
            array_index: 200,
            filter_by: 'match',
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(5);
    });

    describe('filter with numbers', () => {
        const myTestData = [
            {
                _key: 1,
                number: 10
            },
            {
                _key: 2,
                number: 1
            },
            {
                _key: 3,
                number: -1
            },
            {
                _key: 4,
                number: 5
            },
            {
                _key: 5,
                number: 4
            },
        ];

        it('should filter by validator args', async () => {
            const harness = await makeTest({
                field: 'number',
                filter_by: 'validator',
                data_mate_function: 'inNumberRange',
                data_mate_args: {
                    min: 0,
                    max: 5,
                    inclusive: true,
                },
                invert: true
            });
            const results = await harness.runSlice(myTestData);

            expect(results.length).toBe(3);

            const keys = results.map((i) => i._key);

            expect(keys.includes(2));
            expect(keys.includes(4));
            expect(keys.includes(5));
        });
    });

    describe('filter with geo', () => {
        const myTestData = [
            {
                _key: 1,
                boundary: {
                    type: 'Polygon',
                    coordinates: 'coords be here'
                }
            },
            {
                _key: 2,
                boundary: {
                    type: 'LineString',
                    coordinates: 'coords be here'
                }
            },
            {
                _key: 3,
                boundary: {
                    type: 'MultiPolygon',
                    coordinates: 'coords be here'
                }
            }
        ];

        it('should filter docs based on nested values', async () => {
            const harness = await makeTest({
                field: 'boundary.type',
                filter_by: 'match',
                value: [
                    'LineString',
                    'MultiPolygon'
                ]
            });
            const results = await harness.runSlice(myTestData);

            expect(results.length).toBe(1);

            expect(results[0]).toEqual(
                {
                    _key: 1,
                    boundary: {
                        type: 'Polygon',
                        coordinates: 'coords be here'
                    }
                }
            );
        });

        it('should return docs based on nested values if invert is true', async () => {
            const harness = await makeTest({
                field: 'boundary.type',
                filter_by: 'match',
                value: [
                    'LineString',
                    'Polygon'
                ],
                invert: true
            });
            const results = await harness.runSlice(myTestData);

            expect(results.length).toBe(2);

            expect(results).toEqual([
                {
                    _key: 1,
                    boundary: {
                        type: 'Polygon',
                        coordinates: 'coords be here'
                    }
                },
                {
                    _key: 2,
                    boundary: {
                        type: 'LineString',
                        coordinates: 'coords be here'
                    }
                }
            ]);
        });
    });

    describe('filter by size', () => {
        const myTestData = [
            {
                _key: 1,
                name: 'bob',
                age: 12
            },
            {
                _key: 2,
                name: 'reginald of the northern countries',
                age: 12,
                more_stuff: {
                    a: 'thing',
                    b: 'do hicky',
                    c: [
                        'some',
                        'type',
                        'of',
                        'array'
                    ]
                }
            }
        ];

        it('should filter doc based on size', async () => {
            const harness = await makeTest({
                field: 'doc',
                filter_by: 'size',
                value: 100
            });
            const results = await harness.runSlice(myTestData);

            expect(results.length).toBe(1);

            expect(results[0]).toEqual(
                {
                    _key: 1,
                    name: 'bob',
                    age: 12
                }
            );
        });

        it('should return docs over filter size', async () => {
            const harness = await makeTest({
                field: 'doc',
                filter_by: 'size',
                value: 100,
                invert: true
            });
            const results = await harness.runSlice(myTestData);

            expect(results.length).toBe(1);

            expect(results[0]).toEqual(
                {
                    _key: 2,
                    name: 'reginald of the northern countries',
                    age: 12,
                    more_stuff: {
                        a: 'thing',
                        b: 'do hicky',
                        c: [
                            'some',
                            'type',
                            'of',
                            'array'
                        ]
                    }
                }
            );
        });

        it('should filter by field size', async () => {
            const harness = await makeTest({
                field: 'name',
                filter_by: 'size',
                value: 10,
                invert: true
            });
            const results = await harness.runSlice(myTestData);

            expect(results.length).toBe(1);

            expect(results[0]).toEqual(
                {
                    _key: 1,
                    name: 'bob',
                    age: 12
                }
            );
        });
    });

    describe('filter with exception_rules', () => {
        const myTestData = [
            {
                _key: 1,
                name: 'bob',
                age: 22
            },
            {
                _key: 2,
                name: 'ray',
                age: 44
            },
            {
                _key: 3,
                name: 'ran',
                age: 25
            },
            {
                _key: 4,
                name: 'ran',
                age: 99
            },
            {
                _key: 5,
                name: 'ran',
                age: 66
            },
            {
                _key: 6,
                name: 'ran',
                age: 44,
                favorite_baseball_team: 'STL cardinals'
            }
        ];

        it('should filter correctly if exception_rules is undefined', async () => {
            const harness = await makeTest({
                field: 'name',
                value: 'ran'
            });
            const results = await harness.runSlice(myTestData);

            expect(results).toEqual([
                {
                    _key: 1,
                    name: 'bob',
                    age: 22
                },
                {
                    _key: 2,
                    name: 'ray',
                    age: 44
                }
            ]);
        });

        it('should allow for records that match the exception to bypass filter', async () => {
            const harness = await makeTest({
                field: 'name',
                value: 'ran',
                exception_rules: [
                    { field: 'age', value: 99 }
                ]
            });
            const results = await harness.runSlice(myTestData);

            expect(results).toEqual([
                {
                    _key: 1,
                    name: 'bob',
                    age: 22
                },
                {
                    _key: 2,
                    name: 'ray',
                    age: 44
                },
                {
                    _key: 4,
                    name: 'ran',
                    age: 99
                }
            ]);
        });

        it('should allow for records that match any exception rules to bypass filter', async () => {
            const harness = await makeTest({
                field: 'name',
                value: 'ran',
                exception_rules: [
                    { field: 'age', value: 99 },
                    { field: '_key', value: 5 }
                ]
            });
            const results = await harness.runSlice(myTestData);

            expect(results).toEqual([
                {
                    _key: 1,
                    name: 'bob',
                    age: 22
                },
                {
                    _key: 2,
                    name: 'ray',
                    age: 44
                },
                {
                    _key: 4,
                    name: 'ran',
                    age: 99
                },
                {
                    _key: 5,
                    name: 'ran',
                    age: 66
                }
            ]);
        });

        it('should handle a regex in the exception rules', async () => {
            const harness = await makeTest({
                field: 'name',
                value: 'ran',
                exception_rules: [
                    { field: 'favorite_baseball_team', value: '/^stl/i', regex: true }
                ]
            });
            const results = await harness.runSlice(myTestData);

            expect(results).toEqual([
                {
                    _key: 1,
                    name: 'bob',
                    age: 22
                },
                {
                    _key: 2,
                    name: 'ray',
                    age: 44
                },
                {
                    _key: 6,
                    name: 'ran',
                    age: 44,
                    favorite_baseball_team: 'STL cardinals'
                }
            ]);
        });

        it('should validate exception rules', async () => {
            await expect(makeTest({
                field: 'name',
                value: 'ran',
                exception_rules: [
                    // @ts-expect-error
                    { field: 'favorite_baseball_team', regex: true }
                ]
            })).rejects.toThrow();
        });
    });

    describe('filter with field array', () => {
        const myTestData = [
            {
                _key: 1,
                name: 'ray',
                last_name: 'bob',
                age: 20
            },
            {
                _key: 2,
                name: 'joe',
                last_name: 'ray',
                age: 24
            },
            {
                _key: 3,
                name: 'ray',
                last_name: 'smith',
                age: 23
            },
            {
                _key: 4,
                name: 'joe',
                last_name: 'smith',
                age: 21
            },
            {
                _key: 5,
                name: 'harty',
                last_name: 'day',
                age: 22
            }
        ];

        it('should handle an array of fields', async () => {
            const harness = await makeTest({
                field: ['name', 'last_name'],
                value: 'ray'
            });
            const results = await harness.runSlice(myTestData);

            expect(results).toEqual([
                {
                    _key: 4,
                    name: 'joe',
                    last_name: 'smith',
                    age: 21
                },
                {
                    _key: 5,
                    name: 'harty',
                    last_name: 'day',
                    age: 22
                }
            ]);
        });

        it('should handle an array of fields with invert set to true', async () => {
            const harness = await makeTest({
                field: ['name', 'last_name'],
                value: 'ray',
                invert: true
            });
            const results = await harness.runSlice(myTestData);

            expect(results).toEqual([
                {
                    _key: 1,
                    name: 'ray',
                    last_name: 'bob',
                    age: 20
                },
                {
                    _key: 2,
                    name: 'joe',
                    last_name: 'ray',
                    age: 24
                },
                {
                    _key: 3,
                    name: 'ray',
                    last_name: 'smith',
                    age: 23
                }
            ]);
        });
    });
});
