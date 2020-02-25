import 'jest-extended';
import { DataEntity, cloneDeep, OpConfig } from '@terascope/job-components';
import DataWindow from '../asset/src/__lib/data-window';
import Processor from '../asset/src/remove_key/processor';
import Schema from '../asset/src/remove_key/schema';
import { makeTest } from './helpers';

const opConfig: OpConfig = {
    _op: 'set_key',
    field: 'name'
};

const testData = [
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

describe('set_key should', () => {
    const testHarness = makeTest(Processor, Schema);

    beforeAll(async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
    });
    afterAll(() => testHarness.shutdown());

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('return docs as data entities with no field as the key', async () => {
        const results = await testHarness.run(testData) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        expect(results[0].getMetadata('_key')).toBe(undefined);
        expect(results[1].getMetadata('_key')).toBe(undefined);
        expect(results[2].getMetadata('_key')).toBe(undefined);
    });

    it('return data entities with the name field as the key', async () => {
        const newTestData = cloneDeep(testData).map((doc: any) => DataEntity.make(doc, { _key: 'key' }));
        const results = await testHarness.run(newTestData) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].getMetadata('_key')).toBe(undefined);
        expect(results[1].getMetadata('_key')).toBe(undefined);
        expect(results[2].getMetadata('_key')).toBe(undefined);
    });

    it('return data window with data entities metadata _key field as the key', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
            DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
        ];

        const results = await testHarness.run(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].asArray()[0].getMetadata('_key')).toBe(undefined);
        expect(results[0].asArray()[1].getMetadata('_key')).toBe(undefined);
        expect(results[0].asArray()[2].getMetadata('_key')).toBe(undefined);
        expect(results[1].asArray()[0].getMetadata('_key')).toBe(undefined);
        expect(results[1].asArray()[1].getMetadata('_key')).toBe(undefined);
        expect(results[1].asArray()[2].getMetadata('_key')).toBe(undefined);
    });
});
