'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/group_by/processor.js');
const Schema = require('../asset/group_by/schema.js');
const DataWindow = require('../asset/__lib/data-window');

const opConfig = {
    _op: 'group_by',
    field_name: 'id'
};

const testData = [
    {
        id: 1
    },
    {
        id: 2
    },
    {
        id: 2
    },
    {
        id: 2
    },
    {
        id: 3
    },
    {
        id: 3
    }
];

describe('group_by should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('group by id field if input data is an array of objects', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);
        expect(results[0].asArray().length).toBe(1);
        expect(results[0].getMetadata('_key')).toBe(1);

        expect(results[1].asArray().length).toBe(3);
        expect(results[1].getMetadata('_key')).toBe(2);

        expect(results[2].asArray().length).toBe(2);
        expect(results[2].getMetadata('_key')).toBe(3);
    });

    it('group by id field if input data is an array of data windows', async () => {
        const dw1 = DataWindow.make(undefined, testData);

        // 3 -id:2 , 1 - id:3
        const dw2 = DataWindow.make(undefined, testData.slice(1, 4));

        // 1 - id: 3
        const dw3 = DataWindow.make(undefined, testData.slice(5,));

        const results = await testHarness.run([dw1, dw2, dw3]);

        expect(results.length).toBe(3);

        expect(results[0].asArray().length).toBe(1);
        expect(results[0].getMetadata('_key')).toBe(1);

        expect(results[1].asArray().length).toBe(6);
        expect(results[1].getMetadata('_key')).toBe(2);

        expect(results[2].asArray().length).toBe(3);
        expect(results[2].getMetadata('_key')).toBe(3);
    });
});
