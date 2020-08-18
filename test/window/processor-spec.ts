import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { pDelay, AnyObject } from '@terascope/job-components';

const testData = [
    {
        id: 1,
        time: '2019-04-25T18:12:00.000Z'
    },
    {
        id: 2,
        time: '2019-04-25T18:12:01.000Z'
    },
    {
        id: 3,
        time: '2019-04-25T18:12:02.000Z'
    }
];

describe('window', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'window',
            window_length: 1000,
            time_field: 'time',
            event_window_expiration: 1
        };
        const opConfig = config ? Object.assign({}, _op, config) : _op;

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

    it('should return the docs in the window frame', async () => {
        const test = await makeTest();
        let results = await test.runSlice(testData);

        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(2);

        results = await test.runSlice([{ id: 4, time: '2019-04-25T18:12:04.000Z' }]);

        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(1);
    });

    it('should not return any data if window is not expired', async () => {
        const test = await makeTest({
            event_window_expiration: 30000,
            window_length: 30000
        });

        let results = await test.runSlice(testData);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('should return data as windows expire', async () => {
        const test = await makeTest({
            window_length: 7000,
            event_window_expiration: 100
        });

        const data = [];
        let time = new Date();

        for (let i = 0; i < 20; i++) {
            // @ts-expect-error
            time = new Date(Date.parse(time) + 1000).toISOString();
            const doc = {
                time
            };
            data.push(doc);
        }

        let results = await test.runSlice(data.slice(0, 3));
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(data.slice(3, 6));
        expect(results).toBeArrayOfSize(0);

        // window expires
        results = await test.runSlice(data.slice(6, 9));
        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(8);

        results = await test.runSlice(data.slice(9, 12));
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(data.slice(12, 15));
        expect(results).toBeArrayOfSize(0);

        // window expires
        results = await test.runSlice(data.slice(15, 18));
        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(8);

        results = await test.runSlice(data.slice(18));
        expect(results).toBeArrayOfSize(0);

        // all event windows should be expired by now
        await pDelay(250);
        const windowResult = (await test.runSlice([]));

        expect(windowResult).toBeArrayOfSize(1);
        expect(windowResult[0].asArray()).toBeArrayOfSize(4);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('should handle data with same times', async () => {
        const data = [];
        const time = new Date();

        for (let i = 0; i < 5; i++) {
            const doc = {
                time: time.toISOString(),
                id: i
            };
            data.push(doc);
        }

        const test = await makeTest({
            window_length: 1000,
            event_window_expiration: 2
        });

        let results = await test.runSlice(data);
        expect(results).toBeArrayOfSize(0);

        // all event windows should be expired by now
        await pDelay(250);
        const windowResult = (await test.runSlice([]));

        expect(windowResult).toBeArrayOfSize(1);
        expect(windowResult[0].asArray()).toBeArrayOfSize(5);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('handle out of order data', async () => {
        const time = new Date();

        const data = [
            {
                id: 1,
                time: time.getTime()
            },
            {
                id: 2,
                time: time.getTime() - 1000
            },
            {
                id: 5,
                time: time.getTime() + 6000
            }
        ];

        const test = await makeTest({
            window_length: 5000,
            event_window_expiration: 100
        });

        let results = await test.runSlice(data);

        expect(results).toBeArrayOfSize(1);
        expect(results[0].asArray()).toBeArrayOfSize(2);

        // all event windows should be expired by now
        await pDelay(250);
        const windowResult = (await test.runSlice([]));

        expect(windowResult).toBeArrayOfSize(1);
        expect(windowResult[0].asArray()).toBeArrayOfSize(1);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('should assign window data based on clock time', async () => {
        const data: any[] = [];

        for (let i = 0; i < 3000; i++) {
            const doc = {
                id: i,
                time: new Date()
            };
            data.push(doc);
        }

        const test = await makeTest({
            window_length: 100,
            time_field: 'time',
            window_time_setting: 'clock',
        });

        // first slice processed before window expires
        const results = await test.runSlice(data.slice(0, 1000));
        expect(results).toBeArrayOfSize(0);

        // all event windows should be expired by now
        await pDelay(250);
        let windowResult = (await test.runSlice(data.slice(1000, 2000)));

        expect(windowResult).toBeArrayOfSize(1);
        expect(windowResult[0].asArray()).toBeArrayOfSize(1000);
        expect(windowResult[0].get(0).id).toBe(0);
        expect(windowResult[0].get(999).id).toBe(999);

        // need to wait for window to expire
        await pDelay(250);
        windowResult = (await test.runSlice(data.slice(2000, 3000)));

        expect(windowResult).toBeArrayOfSize(1);
        expect(windowResult[0].asArray()).toBeArrayOfSize(1000);
        expect(windowResult[0].get(0).id).toBe(1000);

        // need to wait for window to expire
        await pDelay(250);
        windowResult = (await test.runSlice([]));

        expect(windowResult).toBeArrayOfSize(1);
        expect(windowResult[0].asArray()).toBeArrayOfSize(1000);
        expect(windowResult[0].get(0).id).toBe(2000);
        expect(windowResult[0].get(999).id).toBe(2999);
    });

    it('should use sliding windows and assign docs to correct windows', async () => {
        const data: any[] = [];
        let time = 1556300016000;

        for (let i = 0; i < 20; i++) {
            time += 1000;
            const doc = {
                time: new Date(time).toISOString()
            };
            data.push(doc);
        }

        const test = await makeTest({
            window_length: 3000,
            window_type: 'sliding',
            sliding_window_interval: 2000,
            time_field: 'time',
            window_time_setting: 'event',
            event_window_expiration: 100
        });

        let results = await test.runSlice(data.slice(0, 10));

        expect(results).toBeArrayOfSize(3);
        results.forEach((window) => expect(window.asArray()).toBeArrayOfSize(4));

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);

        results = await test.runSlice(data.slice(10,));
        expect(results).toBeArrayOfSize(5);
        results.forEach((window) => expect(window.asArray()).toBeArrayOfSize(4));

        // need to wait for window to expire
        await pDelay(250);
        const windowResult = (await test.runSlice([]));

        expect(windowResult).toBeArrayOfSize(2);
        expect(windowResult[0].asArray()).toBeArrayOfSize(4);
        expect(windowResult[1].asArray()).toBeArrayOfSize(2);

        results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('return 2 windows on first slice and should flush', async () => {
        const test = await makeTest({
            time_field: 'time',
            window_time_setting: 'event',
            window_length: 10,
            event_window_expiration: 0
        });

        const results = await test.runSlice(testData);
        expect(results).toBeArrayOfSize(2);

        const flush = await harness.flush();
        expect(flush).toBeArrayOfSize(1);
    });
});
