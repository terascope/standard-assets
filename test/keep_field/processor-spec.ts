import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('keep_field should', () => {
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
            _op: 'keep_field',
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

    it('return data with only the specified field kept', async () => {
        const test = await makeTest();
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                name: 'joe'
            },
            {
                name: 'moe'
            },
            {
                name: 'randy'
            }
        ]);
    });

    it('return data with only the specified field array kept', async () => {
        const test = await makeTest({ field: ['id', 'name'] });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                name: 'joe'
            },
            {
                id: 2,
                name: 'moe'
            },
            {
                id: 3,
                name: 'randy'
            }
        ]);
    });

    it('leave the record empty when none of the kept fields are present', async () => {
        const test = await makeTest({ field: 'not_a_field' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([{}, {}, {}]);
    });

    it('return an empty record rather than dropping it when no field matches', async () => {
        // keep_field is not a filter: a record whose kept field is absent must
        // still pass through as {} (as a DataEntity), never be removed.
        const test = await makeTest({ field: 'not_a_field' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        // no records dropped
        expect(results).toBeArrayOfSize(data.length);
        results.forEach((doc) => {
            expect(DataEntity.isDataEntity(doc)).toBe(true);
            expect(Object.keys(doc)).toBeArrayOfSize(0);
        });
    });

    it('keep matching records populated and non-matching records empty in one batch', async () => {
        const mixed = [
            { id: 1, name: 'joe' },
            { id: 2 },
            { name: 'randy' }
        ];
        const test = await makeTest({ field: 'name' });
        const results = await test.runSlice(cloneDeep(mixed)) as DataEntity[];

        // still three records out — the one with no `name` is kept as {}
        expect(results).toEqual([
            { name: 'joe' },
            {},
            { name: 'randy' }
        ]);
    });

    it('return data window with only the specified fields kept for each record', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe', age: 22 }, { id: 2, name: 'moe', age: 21 }, { id: 3, name: 'randy', age: 24 }]),
            DataWindow.make('2', [{ id: 4, name: 'floe', age: 32 }, { id: 5, name: 'noe', age: 34 }, { id: 6, name: 'blandy', age: 35 }])
        ];
        const test = await makeTest({ field: ['id', 'age'] });

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
