import 'jest-extended';
import { DataEntity, cloneDeep, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import path from 'path';
import axios from 'axios';

describe('count_by_field processor', () => {
    let harness: WorkerTestHarness;
    let data: AnyObject[];

    beforeEach(async () => {
        jest.resetAllMocks();

        data = [
            {
                node_id: 100,
                ip: '192.168.0.4'
            },
            {
                node_id: 101,
                ip: '192.168.0.5'
            },
            {
                node_id: 101,
                ip: '192.168.0.2'
            },
            {
                ip: '192.168.0.3'
            }
        ];
    });

    async function makeTest(testConfig : AnyObject = {}) {
        const jobWithCollectMetrics = newTestJobConfig({
            apis: [
                {
                    _name: 'job_metric_api',
                    default_metrics: testConfig.default_metrics,
                    port: testConfig.port
                }
            ],
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true
                },

                {
                    _op: 'count_by_field',
                    metric_api_name: 'job_metric_api',
                    field: 'node_id',
                    collect_metrics: testConfig.collect_metrics

                },
                {
                    _op: 'count_by_field',
                    metric_api_name: 'job_metric_api',
                    field: 'ip',
                    collect_metrics: testConfig.collect_metrics

                },
                {
                    _op: 'noop'
                },
            ]
        });

        jest.restoreAllMocks();

        harness = new WorkerTestHarness(jobWithCollectMetrics, {
            assetDir: path.join(__dirname, '../../asset')
        });

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        jest.resetAllMocks();
        await harness.shutdown();
        await harness.flush();
    });
    afterAll(async () => {
        jest.resetAllMocks();
        await harness.shutdown();
        await harness.flush();
    });

    it('should generate an empty result if no input data', async () => {
        const testConfig = {
            port: 3350,
            collect_metrics: false,
            default_metrics: false
        };
        const test = await makeTest(testConfig);
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('should just pass doc when collect metrics is false', async () => {
        const testConfig = {
            port: 3351,
            collect_metrics: false,
            default_metrics: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toBeArrayOfSize(4);
        const response = await axios.get<string>(`http://localhost:${testConfig.port}/metrics`);
        const responseOutput = response.data.split('\n');
        expect(responseOutput.length).toEqual(2);
        expect(responseOutput[0]).toEqual('');
        expect(responseOutput[1]).toEqual('');
    });

    it('should include metrics when collect metrics is true', async () => {
        const testConfig = {
            port: 3353,
            collect_metrics: true,
            default_metrics: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(DataEntity.isDataEntity(doc)).toBe(true);
        });
        expect(results).toBeArrayOfSize(4);
        const metricName = 'teraslice_job_count_by_field_count_total';

        const response = await axios.get<string>(`http://localhost:${testConfig.port}/metrics`);
        const responseOutput = response.data.split('\n');
        expect(responseOutput[0]).toEqual('# HELP teraslice_job_count_by_field_count_total count_by_field value field count');
        // node_id 100 count
        expect(responseOutput[2].slice(-1)).toEqual('1');
        expect(
            responseOutput[2].split(metricName)[1].replace(
                '{', '').replace('}', '').split(',')[0].split('=')).toEqual(
            ['value', '"100"']);
        expect(responseOutput[2].split(metricName)[1].replace(
            '{', '').replace('}', '').split(',')[1].split('=')).toEqual(
            ['field', '"node_id"']);

        // node_id 101 count
        expect(responseOutput[3].slice(-1)).toEqual('2');
        // node_id undefined count
        expect(responseOutput[4].slice(-1)).toEqual('1');
        expect(
            responseOutput[4].split(metricName)[1].replace(
                '{', '').replace('}', '').split(',')[0].split('=')).toEqual(
            ['value', '"undefined"']);
        expect(responseOutput[4].split(metricName)[1].replace(
            '{', '').replace('}', '').split(',')[1].split('=')).toEqual(
            ['field', '"node_id"']);
        expect(responseOutput[5].slice(-1)).toEqual('1');
        expect(responseOutput[6].slice(-1)).toEqual('1');
        expect(responseOutput[7].slice(-1)).toEqual('1');
        expect(responseOutput[8].slice(-1)).toEqual('1');
        expect(
            responseOutput[8].split(metricName)[1].replace(
                '{', '').replace('}', '').split(',')[0].split('=')).toEqual(
            ['value', '"192.168.0.3"']);
        expect(responseOutput[8].split(metricName)[1].replace(
            '{', '').replace('}', '').split(',')[1].split('=')).toEqual(
            ['field', '"ip"']);
        expect(responseOutput[9]).toEqual('');
        expect(responseOutput.length).toEqual(10);
    });
});
