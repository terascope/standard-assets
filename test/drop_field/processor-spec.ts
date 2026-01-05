import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('drop_field should', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

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

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'drop_field',
            field: 'name'
        };

        const opConfig: OpConfig = config ? Object.assign({}, _op, config) : _op;
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

    it('return data with specified field dropped', async () => {
        const test = await makeTest();
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                age: 29
            },
            {
                id: 2,
                age: 42
            },
            {
                id: 3,
                age: 87
            }
        ]);
    });

    it('return data with specified field array dropped', async () => {
        const test = await makeTest({ field: ['age', 'name'] });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1
            },
            {
                id: 2
            },
            {
                id: 3
            }
        ]);
    });

    it('return data window with source field copied to destination field for each record', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe', age: 22 }, { id: 2, name: 'moe', age: 21 }, { id: 3, name: 'randy', age: 24 }]),
            DataWindow.make('2', [{ id: 4, name: 'floe', age: 32 }, { id: 5, name: 'noe', age: 34 }, { id: 6, name: 'blandy', age: 35 }])
        ];
        const test = await makeTest();

        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        expect(results[0].asArray()[0]).toEqual({ id: 1, age: 22 });
        expect(results[0].asArray()[1]).toEqual({ id: 2, age: 21 });
        expect(results[0].asArray()[2]).toEqual({ id: 3, age: 24 });
        expect(results[1].asArray()[0]).toEqual({ id: 4, age: 32 });
        expect(results[1].asArray()[1]).toEqual({ id: 5, age: 34 });
        expect(results[1].asArray()[2]).toEqual({ id: 6, age: 35 });
    });
});
