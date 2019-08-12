'use strict';

const _ = require('lodash');
const { DataEntity } = require('@terascope/utils');
const { OpTestHarness } = require('teraslice-test-harness');

const DataWindow = require('../asset/__lib/data-window');
const Processor = require('../asset/remove_key/processor.js');
const Schema = require('../asset/remove_key/schema.js');

const opConfig = {
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
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });
    afterAll(() => testHarness.shutdown());

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('return docs as data entities with no field as the key', async () => {
        const results = await testHarness.run(testData);
        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].getMetadata('_key')).toBe(undefined);
        expect(results[1].getMetadata('_key')).toBe(undefined);
        expect(results[2].getMetadata('_key')).toBe(undefined);
    });

    it('return data entities with the name field as the key', async () => {
        const newTestData = _.cloneDeep(testData).map((doc) => DataEntity.make(doc, { _key: 'key' }));

        const results = await testHarness.run(newTestData);
        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].getMetadata('_key')).toBe(undefined);
        expect(results[1].getMetadata('_key')).toBe(undefined);
        expect(results[2].getMetadata('_key')).toBe(undefined);
    });
});

describe('set_key should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('return data window with data entities metadata _key field as the key', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
            DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
        ];

        const results = await testHarness.run(testWindow);

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));
        expect(results[0].asArray()[0].getMetadata('_key')).toBe(undefined);
        expect(results[0].asArray()[1].getMetadata('_key')).toBe(undefined);
        expect(results[0].asArray()[2].getMetadata('_key')).toBe(undefined);
        expect(results[1].asArray()[0].getMetadata('_key')).toBe(undefined);
        expect(results[1].asArray()[1].getMetadata('_key')).toBe(undefined);
        expect(results[1].asArray()[2].getMetadata('_key')).toBe(undefined);
    });
});
