import 'jest-extended';
import path from 'path';
import axios from 'axios';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { DataEntity } from '@terascope/job-components';
import JobMetricApi from '../../asset/src/job_metric_api/api';

describe('job_metric_api', () => {
    const jobWithDefaultMetrics = newTestJobConfig({
        apis: [
            {
                _name: 'job_metric_api',
                default_metrics: true,
                port: 3339
            }
        ],
        operations: [
            {
                _op: 'test-reader',
                passthrough_slice: true
            },
            {
                _op: 'noop'
            },
        ]
    });
    const testRecord = DataEntity.make({
        band: 'Riot',
        genre: 'Hard Rock'
    });

    let harness: WorkerTestHarness;

    beforeEach(async () => {
        jest.restoreAllMocks();

        harness = new WorkerTestHarness(jobWithDefaultMetrics, {
            assetDir: path.join(__dirname, '../../asset')
        });
        const api = harness.getOperationAPI<JobMetricApi>('job_metric_api');
        api.initialize = jest.fn(async () => Promise.resolve());
        await harness.initialize();
    });

    afterEach(async () => {
        jest.resetAllMocks();
        await harness.shutdown();
    });
    it('returns records', async () => {
        harness = new WorkerTestHarness(jobWithDefaultMetrics, {
            assetDir: path.join(__dirname, '../../asset')
        });
        const api = harness.getOperationAPI<JobMetricApi>('job_metric_api');
        api.initialize = jest.fn(async () => Promise.resolve());
        await harness.initialize();
        const records = await harness.runSlice([testRecord]);
        expect(records.length).toEqual(1);
        jest.resetAllMocks();
        await harness.shutdown();
    });
    it('includes default metrics when default_metrics is true', async () => {
        const response = await axios.get('http://localhost:3339/metrics');
        const responseOutput = response.data.split('\n');
        expect(responseOutput[0]).toEqual('# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.');
        expect(responseOutput[1]).toEqual('# TYPE process_cpu_user_seconds_total counter');
        expect(responseOutput[2].split(' ')[0]).toEqual('process_cpu_user_seconds_total');
        expect(typeof (responseOutput[2].split(' ')[1])).toEqual('string');
        const records = await harness.runSlice([testRecord]);
        expect(records.length).toEqual(1);
    });
});
