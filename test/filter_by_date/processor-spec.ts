import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subtractFromDate, addToDate, getTime, cloneDeep } from '@terascope/core-utils';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { FilterByDateConfig } from '../../asset/src/filter_by_date/interfaces.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nowDate = new Date();
const currentTimeMilliSeconds = getTime(nowDate) as number;
const currentISO8601 = new Date().toISOString();
const oneWeekAgoIso8601 = new Date(
    Number(currentTimeMilliSeconds) - (7 * 24 * 3600 * 1000)
).toISOString();
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

describe('filter_by_date', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<FilterByDateConfig> = {}) {
        const baseConfig = {
            _op: 'filter_by_date',
            _dead_letter_action: 'none',
            collect_metrics: false
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
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toEqual(0);
    });

    it('should return only documents that have a date within the date guards (short range)', async () => {
        harness = await makeTest({
            date_field: 'timestamp',
            limit_past: '2week',
            limit_future: '2day'
        });
        const results = await harness.runSlice(jsonData);

        expect(results.length).toBe(4);
    });

    it('should return only documents that have a date within the date guards (large range)', async () => {
        harness = await makeTest({
            date_field: 'timestamp',
            limit_past: '1000Y',
            limit_future: '100000day'
        });
        const results = await harness.runSlice(jsonData);

        expect(results.length).toBe(7);
    });

    it('data should be unchanged by filter_by_date', async () => {
        const data = [
            { timestamp: Date.now(), ip: '116.206.15.22' },
            { timestamp: Date.now(), ip: '114.125.58.223' },
            { timestamp: Date.now(), ip: '177.79.65.34' },
            { timestamp: Date.now(), ip: '223.39.145.50' },
            { timestamp: Date.now(), ip: '223.33.181.51' }
        ];

        harness = await makeTest({
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

        harness = await makeTest({
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

        harness = await makeTest({
            limit_future: new Date(limitFuture).toISOString(),
            date_field: 'date'
        });
        const results = await harness.runSlice(testData);

        expect(results.length).toEqual(2);
    });
});

describe('with metrics enabled', () => {
    it('should track metrics for rejected records', async () => {
        const promEnabled = true;
        const promDefault = false;
        const promPort = 3390;

        const jobWithCollectMetrics = newTestJobConfig({
            prom_metrics_enabled: promEnabled,
            prom_metrics_port: promPort,
            prom_metrics_add_default: promDefault,
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true
                },
                {
                    _op: 'filter_by_date',
                    date_field: 'timestamp',
                    limit_past: '2week',
                    limit_future: '2day',
                    collect_metrics: true,
                    _dead_letter_action: 'none'

                },
                {
                    _op: 'noop'
                },
            ]
        });

        const harness = new WorkerTestHarness(jobWithCollectMetrics, {
            assetDir: path.join(dirname, '../../asset'),
            cluster_manager_type: 'kubernetesV2'
        });

        await harness.context.apis.foundation.promMetrics.init({
            terasliceName: 'ts-test',
            assignment: 'worker',
            logger: harness.context.logger,
            tf_prom_metrics_enabled: false,
            tf_prom_metrics_port: 3333,
            tf_prom_metrics_add_default: true,
            job_prom_metrics_enabled: promEnabled,
            job_prom_metrics_port: promPort,
            job_prom_metrics_add_default: promDefault,
            prom_metrics_display_url:
                harness.context.sysconfig.terafoundation.prom_metrics_display_url,
            labels: {
                assignment: 'worker'
            }
        });

        await harness.initialize();

        const results = await harness.runSlice(cloneDeep(jsonData));

        expect(results.length).toBe(4);

        const metrics: string = await harness.context.apis.scrapePromMetrics();

        const rejectedPast = metrics.split('\n').filter((line: string) => line.includes('past_rejection'))[0];
        const rejectedFuture = metrics.split('\n').filter((line: string) => line.includes('future_rejection'))[0];
        const rejectedBadDate = metrics.split('\n').filter((line: string) => line.includes('bad_date_field_rejection'))[0];

        expect(rejectedPast.split(' ')[1]).toBe('2');
        expect(rejectedFuture.split(' ')[1]).toBe('1');
        expect(rejectedBadDate.split(' ')[1]).toBe('10');

        const metricsB: string = await harness.context.apis.scrapePromMetrics();

        const rejectedPastB = metricsB.split('\n').filter((line: string) => line.includes('past_rejection'))[0];
        const rejectedFutureB = metricsB.split('\n').filter((line: string) => line.includes('future_rejection'))[0];
        const rejectedBadDateB = metricsB.split('\n').filter((line: string) => line.includes('bad_date_field_rejection'))[0];

        expect(rejectedPastB.split(' ')[1]).toBe('2');
        expect(rejectedFutureB.split(' ')[1]).toBe('1');
        expect(rejectedBadDateB.split(' ')[1]).toBe('10');

        // run next slice
        await harness.runSlice(cloneDeep(jsonData));

        const metrics2: string = await harness.context.apis.scrapePromMetrics();
        const rejectedPast2 = metrics2.split('\n').filter((line: string) => line.includes('past_rejection'))[0];
        const rejectedFuture2 = metrics2.split('\n').filter((line: string) => line.includes('future_rejection'))[0];
        const rejectedBadDate2 = metrics2.split('\n').filter((line: string) => line.includes('bad_date_field_rejection'))[0];

        expect(rejectedPast2.split(' ')[1]).toBe('4');
        expect(rejectedFuture2.split(' ')[1]).toBe('2');
        expect(rejectedBadDate2.split(' ')[1]).toBe('20');

        await harness.context.apis.foundation.promMetrics.deleteMetric('filter_by_date_filtered_count');
        await harness.context.apis.foundation.promMetrics.shutdown();
        await harness.shutdown();
        await harness.flush();
    });
});
