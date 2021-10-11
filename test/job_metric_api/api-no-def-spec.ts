import 'jest-extended';
import path from 'path';
import axios from 'axios';
import _fs from 'fs';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { DataEntity } from '@terascope/job-components';
import JobMetricApi from '../../asset/src/job_metric_api/api';

const fs = _fs.promises;

describe('job_metric_api', () => {
    const jobWithOutDefaultMetrics = newTestJobConfig({
        apis: [
            {
                _name: 'job_metric_api',
                default_metrics: false,
                port: 3338
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
            {
                _op: 'job_metric_example',
                metric_api_name: 'job_metric_api'
            }
        ]
    });

    const testRecord = DataEntity.make({
        band: 'Riot',
        genre: 'Hard Rock'
    });

    let harness: WorkerTestHarness;
    beforeAll(async () => {
        await fs.unlink(path.join(__dirname, '../../asset/src/job_metric_example')).catch(() => {
            // ignore the error
        });
        await fs.symlink(
            path.join(__dirname, '../fixtures/job_metric_example'),
            path.join(__dirname, '../../asset/src/job_metric_example')
        ).catch(() => {
            // ignore the error
        });
    });

    beforeEach(async () => {
        jest.restoreAllMocks();

        harness = new WorkerTestHarness(jobWithOutDefaultMetrics, {
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

    afterAll(async () => {
        await fs.unlink(path.join(__dirname, '../../asset/src/job_metric_example')).catch(() => {
            // ignore the error
        });
        await harness.flush();
    });

    it('does not include default metrics when default_metrics is false', async () => {
        const records = await harness.runSlice([testRecord]);
        expect(records.length).toEqual(1);
        try {
            await axios.get('http://localhost:3338');
            throw new Error('Expected this test to fail');
        } catch (err) {
            expect(err).toHaveProperty('response.status', 404);
            expect(err).toHaveProperty(
                'response.data',
                "See the '/metrics' endpoint for the teraslice job metric exporter\n"
            );
        }

        const response = await axios.get<string>('http://localhost:3338/metrics');
        const responseOutput = response.data.split('\n');
        expect(responseOutput[0]).toEqual('# HELP teraslice_job_job_metric_example_cache_hits_total job_metric_example state storage cache hits');
        expect(responseOutput[1]).toEqual('# TYPE teraslice_job_job_metric_example_cache_hits_total counter');
        expect(responseOutput[2]).toContain('teraslice_job_job_metric_example_cache_hits_total');
        expect(response.data).toContain('teraslice_job_job_metric_example_cache_hits_total{units="hits",op_name="job_metric_example",ex_id="undefined",job_id="undefined",job_name="test-job",name="worker:test-job"}');
        expect(responseOutput[3]).toEqual('');
        expect(responseOutput[4]).toEqual('# HELP teraslice_job_job_metric_example_cache_misses_total job_metric_example state storage cache misses');
        expect(responseOutput[5]).toEqual('# TYPE teraslice_job_job_metric_example_cache_misses_total gauge');
        expect(responseOutput[8]).toEqual('# HELP teraslice_job_job_metric_example_cache_duration_seconds job_metric_example state storage cache duration seconds');
        expect(responseOutput[9]).toEqual('# TYPE teraslice_job_job_metric_example_cache_duration_seconds histogram');
        expect(responseOutput[10]).toEqual('teraslice_job_job_metric_example_cache_duration_seconds_bucket{le="0.1",op_name="job_metric_example",ex_id="undefined",job_id="undefined",job_name="test-job",name="worker:test-job"} 0');
        expect(responseOutput[18]).toEqual('teraslice_job_job_metric_example_cache_duration_seconds_count{op_name="job_metric_example",ex_id="undefined",job_id="undefined",job_name="test-job",name="worker:test-job"} 1');
        expect(responseOutput[27]).toEqual('teraslice_job_job_metric_example_cache_summary_count{op_name="job_metric_example",ex_id="undefined",job_id="undefined",job_name="test-job",name="worker:test-job"} 1');
        expect(responseOutput[28]).toEqual('');
        expect(responseOutput.length).toEqual(29);
    });
});
