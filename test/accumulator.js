'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/accumulator/processor.js');
const Schema = require('../asset/accumulator/schema.js');

const testData = [
    {
        id: 1
    },
    {
        id: 3,
        type: 'string'
    },
    {
        id: 2
    }
];

describe('accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulator',
                sort_field: 'id',
                order: 'desc',
                empty_after: 3,
                batch_size: 1
            }
        });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('generate unsorted results', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);
        expect(results).toBe(testData);
    });
});

describe('accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    let localData;
    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulator',
                sort_field: 'id',
                order: 'desc',
                empty_after: 3,
                batch_size: 500
            }
        });

        for (let i = 0; i < 100; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 3
            }));
        }
    });

    it('accumulate all results into a single result slice', async () => {
        // Push 3 sets of data. No data should be return during accumulation
        let results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        const results2 = await testHarness.run([]);
        expect(results2.length).toBe(0);

        const results3 = await testHarness.run([]);
        expect(results3.length).toBe(0);

        // After the 3rd empty slice we should see results.
        // batch_size is 50 so we expect all 300 records back
        // in one chunk
        const results4 = await testHarness.run([]);
        expect(results4.length).toBe(300);
    });
});