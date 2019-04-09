'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/sorted_accumulator/processor.js');
const Schema = require('../asset/sorted_accumulator/schema.js');

const opConfigAscending = {
    _op: 'sorted_accumulator',
    sort_field: 'id',
    empty_after: 0
};

const opConfigDescending = {
    _op: 'sorted_accumulator',
    sort_field: 'id',
    order: 'desc',
    empty_after: 0
};

const opConfigEmptySlices = {
    _op: 'sorted_accumulator',
    sort_field: 'id',
    order: 'desc',
    empty_after: 3,
    batch_size: 1
};

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

describe('sorted_accumulator should', () => {
    let testHarness;

    beforeEach(async () => {
        testHarness = new OpTestHarness({ Processor, Schema })
        await testHarness.initialize({ opConfig: opConfigAscending });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('generate sorted results by id ascending', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);

        let next = 1;
        results.forEach((doc) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });
});

describe('sorted_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig: opConfigDescending });
    });

    it('generate sorted results by id descending', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);

        let next = 3;
        results.forEach((doc) => {
            expect(doc.id === next).toBe(true);
            next -= 1;
        });
    });
});

describe('sorted_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig: opConfigEmptySlices });
    });

    it('generate sorted results by id descending after 3 empty slices', async () => {
        // Should get no results after the first 3 slices.
        const results = await testHarness.run(testData);
        expect(results.length === 0);

        const results2 = await testHarness.run([]);
        expect(results2.length === 0);

        const results3 = await testHarness.run([]);
        expect(results3.length === 0);

        // After the 3rd empty slice we should see results.
        // batch_size is 1 so we expect 1 record per slice
        const results4 = await testHarness.run([]);
        expect(results4.length).toBe(1);
        expect(results4[0].id).toBe(3);

        const results5 = await testHarness.run([]);
        expect(results5.length).toBe(1);
        expect(results5[0].id).toBe(2);

        const results6 = await testHarness.run([]);
        expect(results6.length).toBe(1);
        expect(results6[0].id).toBe(1);

        // Accumulator should be empty.
        const results7 = await testHarness.run([]);
        expect(results7.length).toBe(0);
    });
});
