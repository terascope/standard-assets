import {
    subtractFromDate, addToDate, getTime, getUnixTime
} from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DateGuardConfig } from '../../asset/src/date_guard/interfaces.js';

const nowDate = new Date();
const currentTimeMilliSeconds = getTime(nowDate) as number;
const currentISO8601 = new Date().toISOString();
const oneWeekAgoIso8601 = new Date(Number(currentTimeMilliSeconds) - (7 * 24 * 3600 * 1000)).toISOString();
const veryLongTimeAgo = currentTimeMilliSeconds - (3600 * 24 * 365 * 1000000000 * 1000);
const farIntoTheFuture = currentTimeMilliSeconds + (3600 * 24 * 365 * 100000000 * 1000);

const referenceDate = new Date().toISOString();

const jsonData = [
    {
        id: 1,
        timestamp: currentTimeMilliSeconds
    },
    {
        id: 3,
        timestamp: veryLongTimeAgo
    },
    {
        id: 4,
        timestamp: farIntoTheFuture
    },
    {
        id: 5,
        timestamp: currentISO8601
    },
    {
        id: 6,
        timestamp: oneWeekAgoIso8601
    },
    {
        id: 7,
        timestamp: '2018-01-30T23:17:58.000Z'
    },
    {
        id: 8,
        timestamp: '2040-04-29T23:17:58.000Z'
    },
    {
        id: 9,
        timestamp: 'bad date'
    },
    {
        id: 10,
        timestamp: 315359998474698950000
    },
    {
        id: 11,
        timestamp: -315359998474698950000
    },
    {
        id: 12,
        timestamp: 0
    },
    {
        id: 13,
        timestamp: 'false'
    },
    {
        id: 14,
        timestamp: '     '
    },
    {
        id: 15,
        timestamp: 'unknown'
    },
    {
        id: 16,
        timestamp: ''
    },
    {
        id: 17,
        timestamp: true
    },
    {
        id: 18,
        timestamp: new Date()
    }
];

describe('date_guard', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<DateGuardConfig> = {}) {
        const baseConfig = {
            _op: 'date_guard',
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) {
            await harness.shutdown();
        }
    });

    it('should generate an empty result if no input data', async () => {
        const harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toEqual(0);
    });

    it('should return only documents that have a date within the date guards (short range)', async () => {
        const harness = await makeTest({
            date_field: 'timestamp',
            limit_past: '2week',
            limit_future: '2day'
        });
        const results = await harness.runSlice(jsonData);

        expect(results.length).toBe(4);
    });

    it('should return only documents that have a date within the date guards (large range)', async () => {
        const harness = await makeTest({
            date_field: 'timestamp',
            limit_past: '1000Y',
            limit_future: '100000day'
        });
        const results = await harness.runSlice(jsonData);

        expect(results.length).toBe(7);
    });

    it('data should be unchanged by date_guard', async () => {
        const data = [
            { timestamp: Date.now(), ip: '116.206.15.22' },
            { timestamp: Date.now(), ip: '114.125.58.223' },
            { timestamp: Date.now(), ip: '177.79.65.34' },
            { timestamp: Date.now(), ip: '223.39.145.50' },
            { timestamp: Date.now(), ip: '223.33.181.51' }
        ];

        const harness = await makeTest({
            date_field: 'timestamp',
            limit_past: '5Y',
            limit_future: '2day'
        });
        const results = await harness.runSlice(data);

        expect(results[0].ip).toEqual('116.206.15.22');
        expect(results[1].ip).toEqual('114.125.58.223');
        expect(results[2].ip).toEqual('177.79.65.34');
        expect(results[3].ip).toEqual('223.39.145.50');
        expect(results[4].ip).toBe('223.33.181.51');
    });

    it('should handle set date and time for past guard', async () => {
        const limitPast = subtractFromDate(referenceDate, { days: 2 });

        const testData = [...new Array(5)].map((x, i) => {
            const date = subtractFromDate(referenceDate, { days: i });
            const doc = {
                _key: i,
                date: new Date(date).toISOString()
            };

            return doc;
        });

        const harness = await makeTest({
            limit_past: new Date(limitPast).toISOString(),
            date_field: 'date'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toEqual(3);
    });

    it('should handle set date and time for future guard', async () => {
        const limitFuture = addToDate(referenceDate, { minutes: 10 });

        const testData = [...new Array(5)].map((x, i) => {
            const date = addToDate(referenceDate, { minutes: i * 10 });
            const doc = {
                _key: i,
                date: new Date(date).toISOString()
            };

            return doc;
        });

        const harness = await makeTest({
            limit_future: new Date(limitFuture).toISOString(),
            date_field: 'date'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toEqual(2);
    });
});
