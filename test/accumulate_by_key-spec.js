'use strict';

const _ = require('lodash');
const { DataEntity } = require('@terascope/job-components');
const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/accumulate_by_key/processor.js');
const Schema = require('../asset/accumulate_by_key/schema.js');

const opConfig = {
    _op: 'accumulate_by_key',
    empty_after: 0
};

const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
const singleKeyData = data.map(doc => DataEntity.make(doc, { _key: 1 }));

const multiKeyData = _.cloneDeep(data);
for (let i = 0; i < data.length; i++) {
    DataEntity.make(multiKeyData[i], { _key: i });
}


describe('accumulate_by_key should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return results for a single key to be grouped together', async () => {
        const results = await testHarness.run(singleKeyData);

        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(3);

        results[0].asArray().forEach((record) => {
            expect(record.getMetadata('_key')).toBe(1);
        });
    });

    it('return results for many keys with a data window per key', async () => {
        const results = await testHarness.run(multiKeyData);

        expect(results.length).toBe(3);

        results.forEach((window, i) => {
            expect(window.asArray().length).toBe(1);
            expect(window.get(0)).toEqual({ id: i + 1 });
            expect(window.getMetadata('_key')).toEqual(i);
        });
    });
});

describe('accumulate_by_key should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    const localData = [];
    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulate_by_key',
                empty_after: 3
            }
        });

        for (let i = 0; i < 100; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 4
            }));
        }
    });

    it('accumulate all results into a single result slice', async () => {
        // Push 3 sets of data. No data should be returned during accumulation
        let results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        // After the 3rd empty slice we should see results.
        // batch_size is 50 so we expect all 300 records back
        // in one chunk
        results = await testHarness.run([]);
        expect(results.length).toBe(4);
        expect(results[0].asArray().length).toBe(75);

        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        // Then another block of data.
        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        // Until the third empty slice when we get a chunk of
        // data again.
        results = await testHarness.run([]);
        expect(results.length).toBe(4);
        expect(results[0].asArray().length).toBe(75);

        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });
});


describe('accumulate_by_key should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    const names = ['joe', 'moe', 'poe', 'randy'];

    const localData = [];
    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulate_by_key',
                empty_after: 3,
                key_field: 'name'
            }
        });

        for (let i = 0; i < 100; i++) {
            const mod = i % 4;
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000),
                name: names[mod]
            }, {
                _key: mod
            }));
        }
    });

    it('accumulate all results into a single result slice by key field', async () => {
        // Push 3 sets of data. No data should be returned during accumulation
        let results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        // After the 3rd empty slice we should see results.
        // batch_size is 50 so we expect all 300 records back
        // in one chunk
        results = await testHarness.run([]);
        expect(results.length).toBe(4);
        expect(results[0].asArray().length).toBe(75);
        expect(results[0].getMetadata('_key')).toBe('joe');
        expect(results[1].getMetadata('_key')).toBe('moe');
        expect(results[2].getMetadata('_key')).toBe('poe');
        expect(results[3].getMetadata('_key')).toBe('randy');
    });
});
