'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/sort/processor.js');
const Schema = require('../asset/sort/schema.js');

const testData = [
    {
        id: 1
    },
    {
        id: 2,
        type: 'string'
    },
    {
        id: 3
    }
];

describe('sort should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sort',
                sort_field: 'id'
            }
        });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('sort input correctly', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);

        let next = 1;
        results.forEach((doc) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });
});
