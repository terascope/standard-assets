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
            _op: 'drop_field',
            field: 'name'
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

    it('return data with field dropped that match regex', async () => {
        const config = {
            drop_method: 'regex',
            method_args: '/.?oe/i'
        };

        const test = await makeTest(config);
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
                name: 'randy',
                age: 87
            }
        ]);
    });

    // it('return data window with specified field dropped', async () => {
    //     const testWindow = [
    //         DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
    //         DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
    //     ];
    //     const test = await makeTest();

    //     const results = await test.runSlice(testWindow) as DataEntity[];

    //     results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

    //     expect(results[0].asArray()[0].name_again).toBe('joe');
    //     expect(results[0].asArray()[1].name_again).toBe('moe');
    //     expect(results[0].asArray()[2].name_again).toBe('randy');
    //     expect(results[1].asArray()[0].name_again).toBe('floe');
    //     expect(results[1].asArray()[1].name_again).toBe('noe');
    //     expect(results[1].asArray()[2].name_again).toBe('blandy');
    // });
});
