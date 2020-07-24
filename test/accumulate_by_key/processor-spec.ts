import 'jest-extended';
import { DataEntity, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window';

const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
const singleKeyData = data.map((doc) => DataEntity.make(doc, { _key: 1 }));
const multiKeyData = data.map((doc, i) => DataEntity.make(doc, { _key: i }));

const emptyAfterData: DataEntity[] = [];

for (let i = 0; i < 100; i++) {
    emptyAfterData.push(DataEntity.make({
        id: Math.floor(Math.random() * 1000)
    }, {
        _key: i % 4
    }));
}

const names = ['joe', 'moe', 'poe', 'randy', 'fin'];
const batchReturnData: DataEntity[] = [];

for (let i = 0; i < 125; i++) {
    const mod = i % 5;
    batchReturnData.push(DataEntity.make({
        id: Math.floor(Math.random() * 1000),
        name: names[mod]
    }, {
        _key: mod
    }));
}

describe('accumulate_by_key', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const opConfig = Object.assign({}, { _op: 'accumulate_by_key', empty_after: 0 }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should generate an empty result if no input data', async () => {
        const test = await makeTest();
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('should return results for a single key to be grouped together', async () => {
        const test = await makeTest();
        const results = await test.runSlice(singleKeyData) as DataWindow[];

        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(3);

        results[0].asArray().forEach((record: DataEntity) => {
            expect(record.getMetadata('_key')).toBe(1);
        });
    });

    it('return results for many keys with a data window per key', async () => {
        const test = await makeTest();
        const results = await test.runSlice(multiKeyData) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        results.forEach((window: DataWindow, i: number) => {
            expect(window.asArray()).toBeArrayOfSize(1);
            expect(window.get(0)).toEqual({ id: i + 1 });
            expect(window.getMetadata('_key')).toEqual(i);
        });
    });

    it('should accumulate all results into a single result slice when empty_after is set to 3', async () => {
        const test = await makeTest({ empty_after: 3 });
        // Push 3 sets of data. No data should be returned during accumulation
        let results = await test.runSlice(emptyAfterData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(emptyAfterData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(emptyAfterData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        // After the 3rd empty slice we should see results in one chunk
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(4);

        // check each window result and key value
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(i);
        });

        // Next slice should be back to 0
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        // Then another block of data.
        results = await test.runSlice(emptyAfterData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(emptyAfterData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(emptyAfterData);
        expect(results).toBeArrayOfSize(0);

        // Next slice should be back to 0
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        // Until the third empty slice when we get a chunk of
        // data again.
        results = await test.runSlice([]);

        // verify each data window size and key
        expect(results).toBeArrayOfSize(4);
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(i);
        });

        // Next slice should be back to 0
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('should return the accumulated data in batches if the batch_data is true', async () => {
        const test = await makeTest({
            empty_after: 3,
            key_field: 'name',
            batch_return: true,
            batch_size: 150
        });

        // Push 3 sets of data. No data should be returned during accumulation
        let results = await test.runSlice(batchReturnData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(batchReturnData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(batchReturnData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        // After the 3rd empty slice we should see results
        // each window has 75 results
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(2);

        // check each window result and key value
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(names[i]);
        });

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(2);

        // check each window result and key value
        results.forEach((result: any, i: number) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe(names[i + 2]);
        });

        // Next slice should return data
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(1);
        results.forEach((result: any) => {
            expect(result.asArray()).toBeArrayOfSize(75);
            expect(result.getMetadata('_key')).toBe('fin');
        });

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('should flush if flush_data_on_shutdown is set to true', async () => {
        const test = await makeTest({
            key_field: 'id',
            empty_after: 10,
            flush_data_on_shutdown: true
        });

        const results = await test.runSlice(data);
        expect(results).toBeArrayOfSize(0);

        const flushResults = await test.flush();
        expect(flushResults).toBeArrayOfSize(3);
    });
});
