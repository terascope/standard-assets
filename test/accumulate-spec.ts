
import 'jest-extended';
import path from 'path';
import { DataEntity, OpConfig } from '@terascope/job-components';
import {
    WorkerTestHarness,
    newTestJobConfig,
    newTestSlice
} from 'teraslice-test-harness';
import Processor from '../asset/src/accumulate/processor';
import Schema from '../asset/src/accumulate/schema';
import DataWindow from '../asset/src/helpers/data-window';
import { makeTest } from './helpers';

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
    const testHarness = makeTest(Processor, Schema);

    let opConfig: OpConfig;
    beforeEach(async () => {
        opConfig = {
            _op: 'accumulate',
            empty_after: 0
        };
    });
    afterEach(() => testHarness.shutdown());

    it('generate an empty result if no input data', async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
        const results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('return a data window with all results', async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
        const results = await testHarness.run(testData) as DataWindow[];

        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()[0]).toEqual(testData[0]);
        expect(results[0].asArray()[1]).toEqual(testData[1]);
        expect(results[0].asArray()[2]).toEqual(testData[2]);
        expect(results[1]).toBeUndefined();
    });
});

describe('accumulate should', () => {
    const testHarness = makeTest(Processor, Schema);
    const localData: DataEntity[] = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'accumulate',
                empty_after: 3
            },
            type: 'processor'
        });

        for (let i = 0; i < 100; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 3
            }));
        }
    });

    afterAll(() => testHarness.shutdown());

    it('accumulate all results into a data window result slice', async () => {
        // Push 3 sets of data. No data should be return during accumulation
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

        // After the 3rd empty slice we should see results.
        // batch_size is 50 so we expect all 300 records back
        // in one chunk
        results = await testHarness.run([]) as DataWindow[];
        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(300);

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
        results = await testHarness.run([]) as DataWindow[];
        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(300);

        // Next slice should be back to 0
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
            _op: 'accumulate',
            empty_after: 10,
            flush_data_on_shutdown: true
        }
    ];

    const testSlice = newTestSlice();
    const harness = new WorkerTestHarness(job);

    beforeAll(() => harness.initialize());
    afterAll(() => harness.shutdown());

    it('return no data after first slice', async () => {
        const results = await harness.runSlice(testSlice);
        expect(results).toBeArrayOfSize(0);
    });

    it('return data after flush event', async () => {
        const results = await harness.flush() as DataWindow[];
        await harness.shutdown();
        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(3);
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
            _op: 'accumulate',
            empty_after: 10,
            flush_data_on_shutdown: false
        }
    ];

    const testSlice = newTestSlice();
    const harness = new WorkerTestHarness(job);

    beforeAll(() => harness.initialize());
    afterAll(() => harness.shutdown());

    it('return no data after first slice', async () => {
        const results = await harness.runSlice(testSlice);
        expect(results).toBeArrayOfSize(0);
    });

    it('return nothing on flush event when flush_data_on_shutdown is false', async () => {
        const results = await harness.flush();
        expect(results).toBeArrayOfSize(0);
    });
});
