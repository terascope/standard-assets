'use strict';

const { DataEntity } = require('@terascope/job-components');
const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/accumulate/processor.js');
const Schema = require('../asset/accumulate/schema.js');

const testData = [
    {
        id: 1
    },
    {
        id: 3,
    },
    {
        id: 2
    }
];

describe('accumulate should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    let opConfig;
    beforeEach(async () => {
        opConfig = {
            _op: 'accumulate',
            empty_after: 0
        };
    });

    it('generate an empty result if no input data', async () => {
        await testHarness.initialize({ opConfig });
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return a data window with all results', async () => {
        await testHarness.initialize({ opConfig });
        const results = await testHarness.run(testData);

        expect(results.length).toBe(1);
        expect(results[0].asArray()[0]).toBe(testData[0]);
        expect(results[0].asArray()[1]).toBe(testData[1]);
        expect(results[0].asArray()[2]).toBe(testData[2]);
        expect(results[1]).toBeUndefined();
    });
});

describe('accumulate should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    const localData = [];
    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulate',
                empty_after: 3
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

    it('accumulate all results into a data window result slice', async () => {
        // Push 3 sets of data. No data should be return during accumulation
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
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(300);

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
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(300);

        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });
});
