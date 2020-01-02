import 'jest-extended';
import path from 'path';
import { DataEntity, OpConfig } from '@terascope/job-components';
import {
    WorkerTestHarness,
    newTestJobConfig,
    newTestSlice
} from 'teraslice-test-harness';
import { Processor, Schema } from '../asset/src/accumulate_by_key';
import DataWindow from '../asset/src/helpers/data-window';
import { makeTest } from './helpers';

const opConfig: OpConfig = {
    _op: 'accumulate_by_key',
    empty_after: 0
};

const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
const singleKeyData = data.map((doc) => DataEntity.make(doc, { _key: 1 }));
const multiKeyData = data.map((doc, i) => DataEntity.make(doc, { _key: i }));

describe('accumulate_by_key should', () => {
    const testHarness = makeTest(Processor, Schema);

    beforeAll(() => testHarness.initialize({ opConfig, type: 'processor' }));
    afterAll(() => testHarness.shutdown());

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('return results for a single key to be grouped together', async () => {
        const results = await testHarness.run(singleKeyData) as DataWindow[];

        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(3);

        results[0].asArray().forEach((record: DataEntity) => {
            expect(record.getMetadata('_key')).toBe(1);
        });
    });

    it('return results for many keys with a data window per key', async () => {
        const results = await testHarness.run(multiKeyData) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        results.forEach((window: DataWindow, i: number) => {
            expect(window.asArray()).toBeArrayOfSize(1);
            expect(window.get(0)).toEqual({ id: i + 1 });
            expect(window.getMetadata('_key')).toEqual(i);
        });
    });
});

describe('accumulate_by_key (with empty_after: 3) should', () => {
    const testHarness = makeTest(Processor, Schema);
    const localData: DataEntity[] = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulate_by_key',
                empty_after: 3
            },
            type: 'processor'
        });

        for (let i = 0; i < 100; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 4
            }));
        }
    });
    afterAll(() => testHarness.shutdown());

    it('accumulate all results into a single result slice', async () => {
        // Push 3 sets of data. No data should be returned during accumulation
        let results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);

        // After the 3rd empty slice we should see results in one chunk
        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(4);

        // check each window result and key value
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(i);
        });

        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);

        // Then another block of data.
        results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);

        // Until the third empty slice when we get a chunk of
        // data again.
        results = await testHarness.run([]);

        // verify each data window size and key
        expect(results).toBeArrayOfSize(4);
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(i);
        });

        // Next slice should be back to 0
        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });
});

describe('accumulate_by_key (with batch return) should', () => {
    const testHarness = makeTest(Processor, Schema);
    const names = ['joe', 'moe', 'poe', 'randy', 'fin'];
    const localData: DataEntity[] = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulate_by_key',
                empty_after: 3,
                key_field: 'name',
                batch_return: true,
                batch_size: 150
            },
            type: 'processor'
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
    afterAll(() => testHarness.shutdown());

    it('return the accumulated data in batches if the batch_data is true', async () => {
        // Push 3 sets of data. No data should be returned during accumulation
        let results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run(localData);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);

        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);

        // After the 3rd empty slice we should see results
        // each window has 75 results
        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(2);

        // check each window result and key value
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(names[i]);
        });

        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(2);

        // check each window result and key value
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(names[i + 2]);
        });

        // Next slice should return data
        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(1);
        results.forEach((result: any) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe('fin');
        });

        results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
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
        expect(results).toBeArrayOfSize(0);
    });

    it('return data on flush event', async () => {
        const results = await harness.flush();
        expect(results).toBeArrayOfSize(3);
    });
});
