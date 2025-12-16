import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('copy_field should', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

    beforeEach(() => {
        data = [
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
        ];
    });

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'copy_field',
            source: 'name',
            destination: 'name_again'
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

    it('return data with source field copied to destination field', async () => {
        const test = await makeTest();
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                name: 'joe',
                name_again: 'joe'
            },
            {
                id: 2,
                name: 'moe',
                name_again: 'moe'
            },
            {
                id: 3,
                name: 'randy',
                name_again: 'randy'
            }
        ]);
    });

    it('return data with source field copied to destination field and source field removed', async () => {
        const test = await makeTest({ source: 'name', destination: 'first_name', delete_source: true });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                first_name: 'joe'
            },
            {
                id: 2,
                first_name: 'moe'
            },
            {
                id: 3,
                first_name: 'randy'
            }
        ]);
    });

    it('return data window with source field copied to destination field for each record', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
            DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
        ];
        const test = await makeTest();

        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        expect(results[0].asArray()[0].name_again).toBe('joe');
        expect(results[0].asArray()[1].name_again).toBe('moe');
        expect(results[0].asArray()[2].name_again).toBe('randy');
        expect(results[1].asArray()[0].name_again).toBe('floe');
        expect(results[1].asArray()[1].name_again).toBe('noe');
        expect(results[1].asArray()[2].name_again).toBe('blandy');
    });
});
