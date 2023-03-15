/* eslint-disable jest/no-focused-tests */
import 'jest-extended';
import crypto from 'crypto';
import { cloneDeep } from '@terascope/utils';
import { DataEntity, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window';

const testData: any[] = [
    {
        name: 'bob',
        age: 122
    },
    {
        name: 'joe',
        age: 34
    },
    {
        name: 'frank',
        age: 99
    }
];

describe('key', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'add_key'
        };

        const opConfig = { ..._op, ...config };

        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should generate an empty result if no input data', async () => {
        const test = await makeTest();
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('should add key to metadata', async () => {
        const test = await makeTest();

        const results = await test.runSlice(testData);

        for (const doc of results) {
            expect(doc.getKey()).toBe(makeKey([doc.age, doc.name], 'md5'));
        }
    });

    it('should use every field and sort to generate the key to each incoming doc', async () => {
        const test = await makeTest();

        const data = cloneDeep(testData);

        data[0].thing = ['some', 'thing'];
        data[1].foo = { bar: 'foo' };

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                thing: ['some', 'thing'],
                _key: makeKey([122, 'bob', ['some', 'thing']], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                foo: { bar: 'foo' },
                _key: makeKey([34, { bar: 'foo' }, 'joe'], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                _key: makeKey([99, 'frank'], 'md5')
            }
        ]);
    });

    it('should only use specified fields to generate the key and add to every doc', async () => {
        const test = await makeTest({ key_fields: ['age'] });

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                _key: makeKey([122], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                _key: makeKey([34], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                _key: makeKey([99], 'md5')
            }
        ]);

        for (const doc of results) {
            expect(doc.getKey()).toBe(makeKey([doc.age], 'md5'));
        }
    });

    it('should only use non-specified fields to generate the key and add to every doc if invert is true', async () => {
        const test = await makeTest({ key_fields: ['age'], invert_key_fields: true });

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                _key: makeKey(['bob'], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                _key: makeKey(['joe'], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                _key: makeKey(['frank'], 'md5')
            }
        ]);

        for (const doc of results) {
            expect(doc.getKey()).toBe(makeKey([doc.name], 'md5'));
        }
    });

    it('should only specified hash algo', async () => {
        const test = await makeTest({ key_fields: ['name'], hash_algorithm: 'sha256' });

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                _key: makeKey(['bob'], 'sha256')
            },
            {
                name: 'joe',
                age: 34,
                _key: makeKey(['joe'], 'sha256')
            },
            {
                name: 'frank',
                age: 99,
                _key: makeKey(['frank'], 'sha256')
            }
        ]);

        for (const doc of results) {
            expect(doc.getKey()).toBe(makeKey([doc.name], 'sha256'));
        }
    });

    it('should not return docs that do not meet the minimum key value requirements', async () => {
        const test = await makeTest({ key_fields: ['name', 'age'], minimum_field_count: 2 });

        const data = cloneDeep(testData);

        delete data[0].age;
        delete data[1].name;

        const results = await test.runSlice(data);

        expect(results.length).toBe(1);

        expect(results).toEqual([
            {
                name: 'frank',
                age: 99,
                _key: makeKey(['frank', 99], 'md5')
            }
        ]);
    });

    it('should preserve original key', async () => {
        const test = await makeTest({ key_fields: ['name', 'age'], preserve_original_key: true });

        const data = cloneDeep(testData).map((doc, i) => {
            doc._key = i + 1;

            return DataEntity.make(doc, { _key: doc._key });
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                _original_key: 1,
                _key: makeKey(['bob', 122], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                _original_key: 2,
                _key: makeKey(['joe', 34], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                _original_key: 3,
                _key: makeKey(['frank', 99], 'md5')
            }
        ]);
    });

    it('should add _delete_id to the metadata', async () => {
        const test = await makeTest({ key_fields: ['name', 'age'], delete_original: true });

        const data = cloneDeep(testData).map((doc, i) => {
            doc._key = i + 1;

            return DataEntity.make(doc, { _key: doc._key });
        });

        const results = await test.runSlice(data);

        results.forEach((doc, i) => {
            const meta = doc.getMetadata();

            expect(meta._key).toBe(makeKey([doc.name, doc.age], 'md5'));
            expect(meta._delete_id).toBe(i + 1);
        });
    });

    it('should truncate an object geo-point if nested values are specified', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location.lon',
                'location.lat'
            ],
            truncate_location: [
                'location.lon',
                'location.lat'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = { lon: -43.4432343234, lat: 55.3454349123934 };
            return doc;
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: makeKey(['bob', 122, -43.4432, 55.3454], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: makeKey(['joe', 34, -43.4432, 55.3454], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: makeKey(['frank', 99, -43.4432, 55.3454], 'md5')
            }
        ]);
    });

    it('should truncate an object geo-point', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = { lon: -43.4432343234, lat: 55.3454349123934 };
            return doc;
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: makeKey(['bob', 122, { lon: -43.4432, lat: 55.3454 }], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: makeKey(['joe', 34, { lon: -43.4432, lat: 55.3454 }], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: makeKey(['frank', 99, { lon: -43.4432, lat: 55.3454 }], 'md5')
            }
        ]);
    });

    it('should truncate array geo-point', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = [-43.4432343234, 55.3454349123934];
            return doc;
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                location: [-43.4432343234, 55.3454349123934],
                _key: makeKey(['bob', 122, [-43.4432, 55.3454]], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                location: [-43.4432343234, 55.3454349123934],
                _key: makeKey(['joe', 34, [-43.4432, 55.3454]], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                location: [-43.4432343234, 55.3454349123934],
                _key: makeKey(['frank', 99, [-43.4432, 55.3454]], 'md5')
            }
        ]);
    });

    it('should truncate array geo-point of strings', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = ['-43.4432343234', '55.3454349123934'];
            return doc;
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                location: ['-43.4432343234', '55.3454349123934'],
                _key: makeKey(['bob', 122, [-43.4432, 55.3454]], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                location: ['-43.4432343234', '55.3454349123934'],
                _key: makeKey(['joe', 34, [-43.4432, 55.3454]], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                location: ['-43.4432343234', '55.3454349123934'],
                _key: makeKey(['frank', 99, [-43.4432, 55.3454]], 'md5')
            }
        ]);
    });

    it('should truncate string geo-point', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = '-43.4432343234, 55.3454349123934';
            return doc;
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                location: '-43.4432343234, 55.3454349123934',
                _key: makeKey(['bob', 122, '-43.4432, 55.3454'], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                location: '-43.4432343234, 55.3454349123934',
                _key: makeKey(['joe', 34, '-43.4432, 55.3454'], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                location: '-43.4432343234, 55.3454349123934',
                _key: makeKey(['frank', 99, '-43.4432, 55.3454'], 'md5')
            }
        ]);
    });

    it('should truncate WKT POINT primitive geo-point', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = 'POINT (-43.4432343234 55.3454349123934)';
            return doc;
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                location: 'POINT (-43.4432343234 55.3454349123934)',
                _key: makeKey(['bob', 122, 'POINT (-43.4432 55.3454)'], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                location: 'POINT (-43.4432343234 55.3454349123934)',
                _key: makeKey(['joe', 34, 'POINT (-43.4432 55.3454)'], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                location: 'POINT (-43.4432343234 55.3454349123934)',
                _key: makeKey(['frank', 99, 'POINT (-43.4432 55.3454)'], 'md5')
            }
        ]);
    });

    it('should truncate a geohash geo-point', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = 'm0r2g7mk6';
            return doc;
        });

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                location: 'm0r2g7mk6',
                _key: makeKey(['bob', 122, 'm0r2g7mk3mcm'], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                location: 'm0r2g7mk6',
                _key: makeKey(['joe', 34, 'm0r2g7mk3mcm'], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                location: 'm0r2g7mk6',
                _key: makeKey(['frank', 99, 'm0r2g7mk3mcm'], 'md5')
            }
        ]);
    });

    it('should throw an error if string geo-point is not recognized', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = 'POINT ()';
            return doc;
        });

        await expect(test.runSlice(data)).rejects.toThrow();
    });

    it('should throw an error if geo-point does not match any formats', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = null;
            return doc;
        });

        await expect(test.runSlice(data)).rejects.toThrow();
    });

    it('should throw and error if array cannot be converted to numbers', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = ['badPoint', '55.3454349123934'];
            return doc;
        });

        await expect(test.runSlice(data)).rejects.toThrow();
    });

    it('should throw an error if object geo-point cannot be truncated', async () => {
        const test = await makeTest({
            key_fields: [
                'name',
                'age',
                'location'
            ],
            truncate_location: [
                'location'
            ],
            truncate_location_places: 4
        });

        const data = cloneDeep(testData).map((doc) => {
            doc.location = { lon: 'no number here', lat: 55.3454349123934 };
            return doc;
        });

        await expect(test.runSlice(data)).rejects.toThrow();
    });

    it('should not add empty fields or objects to key', async () => {
        const test = await makeTest();

        const data = cloneDeep(testData);

        data[0].foo = [];
        data[1].bar = {};
        data[2].foo = null;
        data[2].bar = false;

        const results = await test.runSlice(data);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                foo: [],
                _key: makeKey([122, 'bob'], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                bar: {},
                _key: makeKey([34, 'joe'], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                foo: null,
                bar: false,
                _key: makeKey([99, false, 'frank'], 'md5')
            }
        ]);
    });

    it('should correctly handle data windows', async () => {
        const test = await makeTest();

        const dataWindow = DataWindow.make(1, testData);

        const results = await test.runSlice([dataWindow]);

        expect(results[0].asArray()).toEqual([
            {
                name: 'bob',
                age: 122,
                _key: makeKey([122, 'bob'], 'md5')
            },
            {
                name: 'joe',
                age: 34,
                _key: makeKey([34, 'joe'], 'md5')
            },
            {
                name: 'frank',
                age: 99,
                _key: makeKey([99, 'frank'], 'md5')
            }
        ]);
    });
});

function makeKey(values: unknown[], algo: string) {
    const shasum = crypto.createHash(algo);

    let key = '';

    values.forEach((value) => {
        key += value;
    });

    shasum.update(key);

    return shasum.digest('base64').replace(/=*$/g, '').replace(/\//g, '_').replace(/\+/g, '-');
}
