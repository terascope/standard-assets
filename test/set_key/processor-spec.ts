import 'jest-extended';
import { DataEntity, cloneDeep, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window';

describe('set_key should', () => {
    let harness: WorkerTestHarness;
    let data: AnyObject[];

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

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'set_key',
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

    it('return docs as data entities with name field as the key', async () => {
        const test = await makeTest();
        const results = await test.runSlice(data) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].getMetadata('_key')).toBe('joe');
        expect(results[1].getMetadata('_key')).toBe('moe');
        expect(results[2].getMetadata('_key')).toBe('randy');
    });

    it('return data entities with the name field as the key', async () => {
        const newTestData = cloneDeep(data).map((doc: any) => DataEntity.make(doc, { _key: 'id' }));
        const test = await makeTest();
        const results = await test.runSlice(newTestData) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].getMetadata('_key')).toBe('joe');
        expect(results[1].getMetadata('_key')).toBe('moe');
        expect(results[2].getMetadata('_key')).toBe('randy');
    });

    it('return data window with data entities metadata _key field as the key', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
            DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
        ];
        const test = await makeTest();
        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].asArray()[0].getMetadata('_key')).toBe('joe');
        expect(results[0].asArray()[1].getMetadata('_key')).toBe('moe');
        expect(results[0].asArray()[2].getMetadata('_key')).toBe('randy');
        expect(results[1].asArray()[0].getMetadata('_key')).toBe('floe');
        expect(results[1].asArray()[1].getMetadata('_key')).toBe('noe');
        expect(results[1].asArray()[2].getMetadata('_key')).toBe('blandy');
    });
});
