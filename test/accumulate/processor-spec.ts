import 'jest-extended';
import { DataEntity, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

const testData = [
    { id: 1, time: '2019-04-25T18:12:00.000Z' },
    { id: 2, time: '2019-04-25T18:12:01.000Z' },
    { id: 3, time: '2019-04-25T18:12:02.000Z' }
];

const localData: DataEntity[] = [];

for (let i = 0; i < 100; i++) {
    localData.push(DataEntity.make({
        id: Math.floor(Math.random() * 1000)
    }, {
        _key: i % 3
    }));
}

describe('accumulate', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const opConfig = Object.assign({}, { _op: 'accumulate', empty_after: 0 }, config);
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

    it('should return a data window with all results', async () => {
        const test = await makeTest();
        const results = await test.runSlice(testData);

        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()[0]).toEqual(testData[0]);
        expect(results[0].asArray()[1]).toEqual(testData[1]);
        expect(results[0].asArray()[2]).toEqual(testData[2]);
    });

    it('should accumulate all results into a data window  when empty_after is set to 3', async () => {
        const test = await makeTest({ empty_after: 3 });

        // Push 3 sets of data. No data should be return during accumulation
        let results = await test.runSlice(localData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(localData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(localData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        // After the 3rd empty slice we should see results.
        // batch_size is 50 so we expect all 300 records back
        // in one chunk
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(300);

        // Next slice should be back to 0
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        // Then another block of data.
        results = await test.runSlice(localData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(localData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(localData);
        expect(results).toBeArrayOfSize(0);

        // Next slice should be back to 0
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        // Until the third empty slice when we get a chunk of
        // data again.
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(300);

        // Next slice should be back to 0
        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('should return results when flush_data_on_shutdown is set to true', async () => {
        const test = await makeTest({ flush_data_on_shutdown: true, empty_after: 10 });

        const results1 = await test.runSlice(testData);
        expect(results1).toBeArrayOfSize(0);

        const results2: DataWindow[] = (await harness.flush()) as any;

        expect(results2).toBeArrayOfSize(1);
        expect(results2[0].asArray()).toBeArrayOfSize(3);
    });

    it('should NOT return results when flush_data_on_shutdown is set to false', async () => {
        const test = await makeTest({ flush_data_on_shutdown: false, empty_after: 10 });

        const results1 = await test.runSlice(testData);
        expect(results1).toBeArrayOfSize(0);

        const results2: DataWindow[] = (await harness.flush()) as any;

        expect(results2).toBeArrayOfSize(0);
    });
});
