'use strict';

const path = require('path');
const _ = require('lodash');
const { DataEntity } = require('@terascope/job-components');
const {
    OpTestHarness,
    WorkerTestHarness,
    newTestJobConfig,
    newTestSlice
} = require('teraslice-test-harness');
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

        // After the 3rd empty slice we should see results in one chunk
        results = await testHarness.run([]);
        expect(results.length).toBe(4);

        // check each window result and key value
        results.forEach((result, i) => {
            expect(result.asArray().length).toBe(75);
            expect(result.getMetadata('_key')).toBe(i);
        });

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

        // verify each data window size and key
        expect(results.length).toBe(4);
        results.forEach((result, i) => {
            expect(result.asArray().length).toBe(75);
            expect(result.getMetadata('_key')).toBe(i);
        });


        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });
});


describe('accumulate_by_key should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    const names = ['joe', 'moe', 'poe', 'randy', 'fin'];

    const localData = [];
    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulate_by_key',
                empty_after: 3,
                key_field: 'name',
                batch_return: true,
                batch_size: 150
            }
        });

        for (let i = 0; i < 125; i++) {
            const mod = i % 5;
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000),
                name: names[mod]
            }, {
                _key: mod
            }));
        }
    });

    it('return the accumulated data in batches if the batch_data is true', async () => {
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

        // After the 3rd empty slice we should see results
        // each window has 75 results
        results = await testHarness.run([]);
        expect(results.length).toBe(2);

        // check each window result and key value
        results.forEach((result, i) => {
            expect(result.asArray().length).toBe(75);
            expect(result.getMetadata('_key')).toBe(names[i]);
        });

        results = await testHarness.run([]);
        expect(results.length).toBe(2);

        // check each window result and key value
        results.forEach((result, i) => {
            expect(result.asArray().length).toBe(75);
            expect(result.getMetadata('_key')).toBe(names[i + 2]);
        });

        // Next slice should return data
        results = await testHarness.run([]);
        expect(results.length).toBe(1);
        results.forEach((result) => {
            expect(result.asArray().length).toBe(75);
            expect(result.getMetadata('_key')).toBe('fin');
        });

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });
});

describe('accumulate should', () => {
    const job = newTestJobConfig();

    job.operations = [
        {
            _op: 'test-reader',
            fetcher_data_file_path: path.join(__dirname, 'fixtures', 'data.json')
        },
        {
            _op: 'accumulate_by_key',
            key_field: 'id',
            empty_after: 10,
            flush_data_on_shutdown: true
        }
    ];

    const testSlice = newTestSlice();
    const harness = new WorkerTestHarness(job);

    beforeAll(() => harness.initialize());
    afterAll(() => harness.shutdown());


    it('return nothing on first slice', async () => {
        const results = await harness.runSlice(testSlice);
        expect(results.length).toBe(0);
    });

    it('return data on flush event', async () => {
        const results = await harness.flush();
        expect(results.length).toBe(3);
    });
});
