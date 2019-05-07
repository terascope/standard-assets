'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const DataWindow = require('../asset/__lib/data-window');
const Processor = require('../asset/dedup_by/processor.js');
const Schema = require('../asset/dedup_by/schema.js');

const opConfig = {
    _op: 'dedup',
    dedup_field: 'name'
};

describe('dedup should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('dedup array of data', async () => {
        const keyedTestData = [
            { id: 1, name: 'roy' }, { id: 2, name: 'roy' },
            { id: 2, name: 'bob' }, { id: 2, name: 'roy' },
            { id: 3, name: 'bob' }, { id: 3, name: 'mel' }
        ];

        const results = await testHarness.run(keyedTestData);
        expect(results.length).toBe(3);
        expect(results).toEqual([{ id: 1, name: 'roy' }, { id: 2, name: 'bob' }, { id: 3, name: 'mel' }]);
    });

    it('dedup data windows', async () => {
        const keyedTestData = [
            DataWindow.make(1, [{ id: 1, name: 'roy' }]),
            DataWindow.make(2, [{ id: 2, name: 'roy' }, { id: 2, name: 'bob' }, { id: 2, name: 'roy' }]),
            DataWindow.make(3, [{ id: 3, name: 'bob' }, { id: 3, name: 'mel' }])
        ];

        const results = await testHarness.run(keyedTestData);

        expect(results.length).toBe(3);

        expect(results[0].getMetadata('_key')).toBe(1);
        expect(results[0].asArray()).toEqual([{ id: 1, name: 'roy' }]);

        expect(results[1].getMetadata('_key')).toBe(2);
        expect(results[1].asArray()).toEqual([{ id: 2, name: 'roy' }, { id: 2, name: 'bob' }]);

        expect(results[2].getMetadata('_key')).toBe(3);
        expect(results[2].asArray()).toEqual([{ id: 3, name: 'bob' }, { id: 3, name: 'mel' }]);
    });
});
