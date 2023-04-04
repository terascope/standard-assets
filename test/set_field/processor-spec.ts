import 'jest-extended';
import { DataEntity, cloneDeep, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window';

describe('drop_field should', () => {
    let harness: WorkerTestHarness;
    let data: AnyObject[];

    beforeEach(() => {
        data = [
            {
                id: 1,
                name: 'joe',
                age: 29
            },
            {
                id: 2,
                name: 'moe',
                age: 42
            },
            {
                id: 3,
                name: 'randy',
                age: 87
            }
        ];
    });

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'set_field'
        };

        const opConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('generate an empty result if no input data', async () => {
        const test = await makeTest({ field: 'net_worth', value: 5 });
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('return data with field set', async () => {
        const test = await makeTest({ field: 'height', value: 1643 });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                name: 'joe',
                age: 29,
                height: 1643
            },
            {
                id: 2,
                name: 'moe',
                age: 42,
                height: 1643
            },
            {
                id: 3,
                name: 'randy',
                age: 87,
                height: 1643
            }
        ]);
    });

    it('return data with field set for records where the field is missing', async () => {
        const test = await makeTest({ field: 'height', value: 1643 });
        const testData = cloneDeep(data);
        testData[0].height = 1894;
        const results = await test.runSlice(testData) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                name: 'joe',
                age: 29,
                height: 1894
            },
            {
                id: 2,
                name: 'moe',
                age: 42,
                height: 1643
            },
            {
                id: 3,
                name: 'randy',
                age: 87,
                height: 1643
            }
        ]);
    });

    it('return data with field value overwritten by new value', async () => {
        const test = await makeTest({ field: 'height', value: 1643, overwrite: true });
        const testData = cloneDeep(data);
        testData[0].height = 1894;
        const results = await test.runSlice(testData) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                name: 'joe',
                age: 29,
                height: 1643
            },
            {
                id: 2,
                name: 'moe',
                age: 42,
                height: 1643
            },
            {
                id: 3,
                name: 'randy',
                age: 87,
                height: 1643
            }
        ]);
    });

    it('return data window with source field copied to destination field for each record', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe', age: 22 }, { id: 2, name: 'moe', age: 21 }, { id: 3, name: 'randy', age: 24 }]),
            DataWindow.make('2', [{ id: 4, name: 'floe', age: 32 }, { id: 5, name: 'noe', age: 34 }, { id: 6, name: 'blandy', age: 35 }])
        ];
        const test = await makeTest({ field: 'size', value: 'xxl' });

        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        expect(results[0].asArray()[0].size).toBe('xxl');
        expect(results[0].asArray()[1].size).toBe('xxl');
        expect(results[0].asArray()[2].size).toBe('xxl');
        expect(results[1].asArray()[0].size).toBe('xxl');
        expect(results[1].asArray()[1].size).toBe('xxl');
        expect(results[1].asArray()[2].size).toBe('xxl');
    });
});
