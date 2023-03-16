/* eslint-disable jest/no-focused-tests */
import 'jest-extended';
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

        expect(results[0].getKey()).toBe('ctzV5v3kRQAAEUJfEZt7nA');
        expect(results[1].getKey()).toBe('3VR8R2rXctzyMfW8XQsJFg');
        expect(results[2].getKey()).toBe('dopYygLk3RiI6_L6-VhydQ');
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
                _key: 'spEib0qesWj68-lFBXD_Aw'
            },
            {
                name: 'joe',
                age: 34,
                foo: { bar: 'foo' },
                _key: 'PBHKh3MmS9T0IjwvlEIXYw'
            },
            {
                name: 'frank',
                age: 99,
                _key: 'dopYygLk3RiI6_L6-VhydQ'
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
                _key: 'oKCA9C5vE7Oi3xM_BzCV3Q'
            },
            {
                name: 'joe',
                age: 34,
                _key: '42mFPfdm-kTh7Q_2E_VjvQ'
            },
            {
                name: 'frank',
                age: 99,
                _key: 'rGJ6scy9ti7JbnAvB_ZCWw'
            }
        ]);
    });

    it('should only use non-specified fields to generate the key and add to every doc if invert is true', async () => {
        const test = await makeTest({ key_fields: ['age'], invert_key_fields: true });

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                _key: 'n51RvHDvIcpcFPMHmAop2A'
            },
            {
                name: 'joe',
                age: 34,
                _key: 'j_MkifkvM0FmlL6P3C1MIg'
            },
            {
                name: 'frank',
                age: 99,
                _key: 'JiU8UHQfqpwuK4Nnc8af5g'
            }
        ]);
    });

    it('should only specified hash algo', async () => {
        const test = await makeTest({ key_fields: ['name'], hash_algorithm: 'sha256' });

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                name: 'bob',
                age: 122,
                _key: 'gbY32PzSxtpjWeaWMROhFw3nleS3JbhNHgtM_Z7FjOk'
            },
            {
                name: 'joe',
                age: 34,
                _key: 'eGdcwXYIE3LEOrqz6p-3DHQ4HrAtxuk_ttRNFh2m7rM'
            },
            {
                name: 'frank',
                age: 99,
                _key: 'd2RvWk8xZmN2J6vpmOehRw_nLYtDDwZ9r6hiY_HyP5Q'
            }
        ]);
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
                _key: 'S5nHugeGpGAeLbBeDNBLJA'
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
                _key: 'e6467-UbK9pmMAcFO0xGgQ'
            },
            {
                name: 'joe',
                age: 34,
                _original_key: 2,
                _key: 'wP5XmV4WDEHWREmpN7YRAQ'
            },
            {
                name: 'frank',
                age: 99,
                _original_key: 3,
                _key: 'S5nHugeGpGAeLbBeDNBLJA'
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

        expect(results[0].getMetadata()._delete_id).toBe(1);
        expect(results[1].getMetadata()._delete_id).toBe(2);
        expect(results[2].getMetadata()._delete_id).toBe(3);

        expect(results[0].getKey()).toBe('e6467-UbK9pmMAcFO0xGgQ');
        expect(results[1].getKey()).toBe('wP5XmV4WDEHWREmpN7YRAQ');
        expect(results[2].getKey()).toBe('S5nHugeGpGAeLbBeDNBLJA');
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
                _key: 'VXO_m8MSO2eQh2yRPBrFHw'
            },
            {
                name: 'joe',
                age: 34,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: 'LupNL69izNwDtTOJ-1Ax2w'
            },
            {
                name: 'frank',
                age: 99,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: 'tUY_80h-KwJpUNL_SteHHQ'
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
                _key: 'ZmAUz-JlmID_QphbR9g9Rg'
            },
            {
                name: 'joe',
                age: 34,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: 'wwwfql7nsI-1P9td81Vm9A'
            },
            {
                name: 'frank',
                age: 99,
                location: { lon: -43.4432343234, lat: 55.3454349123934 },
                _key: 'LMKX1DswmPrKDq9SiG25nQ'
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
                _key: 'fdHmQuMtkkSnMEai3BQEEw'
            },
            {
                name: 'joe',
                age: 34,
                location: [-43.4432343234, 55.3454349123934],
                _key: '38N4tH3xNbTjC3-Spe3vdA'
            },
            {
                name: 'frank',
                age: 99,
                location: [-43.4432343234, 55.3454349123934],
                _key: 'YPLpPggl-xPF_TDEa50CCA'
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
                _key: 'fdHmQuMtkkSnMEai3BQEEw'
            },
            {
                name: 'joe',
                age: 34,
                location: ['-43.4432343234', '55.3454349123934'],
                _key: '38N4tH3xNbTjC3-Spe3vdA'
            },
            {
                name: 'frank',
                age: 99,
                location: ['-43.4432343234', '55.3454349123934'],
                _key: 'YPLpPggl-xPF_TDEa50CCA'
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
                _key: 'llbTgbr2KUXHEOmhq7g8Qw'
            },
            {
                name: 'joe',
                age: 34,
                location: '-43.4432343234, 55.3454349123934',
                _key: 'YbCqBl6R7CsJXbzEbWs6sg'
            },
            {
                name: 'frank',
                age: 99,
                location: '-43.4432343234, 55.3454349123934',
                _key: 'IjlFcIaARAbF-a1KkqfYFw'
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
                _key: '5Rstpm4Md5CSTzAciU2W9g'
            },
            {
                name: 'joe',
                age: 34,
                location: 'POINT (-43.4432343234 55.3454349123934)',
                _key: 'qL9URXRqqmu5DFYYKGw14Q'
            },
            {
                name: 'frank',
                age: 99,
                location: 'POINT (-43.4432343234 55.3454349123934)',
                _key: '1f0Pue0bf4LmpMQxZ8Pi-w'
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
                _key: 'bKD4DiLbjo7q45c5-xSpAQ'
            },
            {
                name: 'joe',
                age: 34,
                location: 'm0r2g7mk6',
                _key: 'RWDSU0Xw2ZYnJvzLGTEn-w'
            },
            {
                name: 'frank',
                age: 99,
                location: 'm0r2g7mk6',
                _key: 'K5YQXB9bY-UWn8NaEXyZBw'
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
                _key: 'ctzV5v3kRQAAEUJfEZt7nA'
            },
            {
                name: 'joe',
                age: 34,
                bar: {},
                _key: '3VR8R2rXctzyMfW8XQsJFg'
            },
            {
                name: 'frank',
                age: 99,
                foo: null,
                bar: false,
                _key: 'jmv4RTJMm7Z7vkKXeOuS7Q'
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
                _key: 'ctzV5v3kRQAAEUJfEZt7nA'
            },
            {
                name: 'joe',
                age: 34,
                _key: '3VR8R2rXctzyMfW8XQsJFg'
            },
            {
                name: 'frank',
                age: 99,
                _key: 'dopYygLk3RiI6_L6-VhydQ'
            }
        ]);
    });
});
