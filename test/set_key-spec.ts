
import 'jest-extended';
import { DataEntity, cloneDeep, OpConfig } from '@terascope/job-components';
import DataWindow from '../asset/src/helpers/data-window';
import Processor from '../asset/src/set_key/processor';
import Schema from '../asset/src/set_key/schema';
import { makeTest } from './helpers';

const opConfig: OpConfig = {
    _op: 'set_key',
    field: 'name'
};
// TODO: remove lodash from package.json
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

    it('return docs as data entities with name field as the key', async () => {
        const results = await testHarness.run(testData) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].getMetadata('_key')).toBe('joe');
        expect(results[1].getMetadata('_key')).toBe('moe');
        expect(results[2].getMetadata('_key')).toBe('randy');
    });

    it('return data entities with the name field as the key', async () => {
        const newTestData = cloneDeep(testData).map((doc: any) => DataEntity.make(doc, { _key: 'id' }));

        const results = await testHarness.run(newTestData) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].getMetadata('_key')).toBe('joe');
        expect(results[1].getMetadata('_key')).toBe('moe');
        expect(results[2].getMetadata('_key')).toBe('randy');
    });
});

describe('set_key should', () => {
    const testHarness = makeTest(Processor, Schema);

    beforeAll(async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
    });
    afterAll(() => testHarness.shutdown());

    it('return data window with data entities metadata _key field as the key', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
            DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
        ];

        const results = await testHarness.run(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].asArray()[0].getMetadata('_key')).toBe('joe');
        expect(results[0].asArray()[1].getMetadata('_key')).toBe('moe');
        expect(results[0].asArray()[2].getMetadata('_key')).toBe('randy');
        expect(results[1].asArray()[0].getMetadata('_key')).toBe('floe');
        expect(results[1].asArray()[1].getMetadata('_key')).toBe('noe');
        expect(results[1].asArray()[2].getMetadata('_key')).toBe('blandy');
    });
});
