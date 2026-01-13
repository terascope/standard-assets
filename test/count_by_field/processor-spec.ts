/* eslint-disable no-useless-escape */
import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JobConfigParams } from '@terascope/job-components';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('count_by_field processor', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

    beforeEach(async () => {
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

    async function makeTest(testConfig: Partial<JobConfigParams> = {}) {
        const jobWithCollectMetrics = newTestJobConfig({
            prom_metrics_enabled: testConfig.prom_metrics_enabled,
            prom_metrics_port: testConfig.prom_metrics_port,
            prom_metrics_add_default: testConfig.prom_metrics_add_default,
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true
                },

                {
                    _op: 'count_by_field',
                    field: 'node_id',
                    collect_metrics: testConfig.prom_metrics_enabled

                },
                {
                    _op: 'count_by_field',
                    field: 'ip',
                    collect_metrics: testConfig.prom_metrics_enabled

                },
                {
                    _op: 'noop'
                },
            ]
        });

        harness = new WorkerTestHarness(jobWithCollectMetrics, {
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
            job_prom_metrics_enabled: testConfig.prom_metrics_enabled,
            job_prom_metrics_port: testConfig.prom_metrics_port,
            job_prom_metrics_add_default: testConfig.prom_metrics_add_default,
            prom_metrics_display_url:
                harness.context.sysconfig.terafoundation.prom_metrics_display_url,
            labels: {
                assignment: 'worker'
            }
        });
        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        await harness.context.apis.foundation.promMetrics.deleteMetric('count_by_field_count_total');
        await harness.context.apis.foundation.promMetrics.shutdown();
        await harness.shutdown();
        await harness.flush();
    });
    afterAll(async () => {
        await harness.context.apis.foundation.promMetrics.deleteMetric('count_by_field_count_total');
        await harness.context.apis.foundation.promMetrics.shutdown();
        await harness.shutdown();
        await harness.flush();
    });

    it('should generate an empty result if no input data', async () => {
        const testConfig = {
            prom_metrics_port: 3350,
            prom_metrics_enabled: false,
            prom_metrics_add_default: false
        };
        const test = await makeTest(testConfig);
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('should just pass doc when collect metrics is false', async () => {
        const testConfig = {
            prom_metrics_port: 3351,
            prom_metrics_enabled: false,
            prom_metrics_add_default: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];
        expect(results).toBeArrayOfSize(4);

        const metrics = await test.context.apis.scrapePromMetrics();
        expect(metrics).toBe('');
    });

    it('should include metrics when collect metrics is true', async () => {
        const testConfig = {
            prom_metrics_port: 3353,
            prom_metrics_enabled: true,
            prom_metrics_add_default: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(DataEntity.isDataEntity(doc)).toBe(true);
        });
        expect(results).toBeArrayOfSize(4);

        const metrics: string = await test.context.apis.scrapePromMetrics();

        const nodeIdLines = metrics.split('\n').filter((line: string) => line.includes('node_id'));
        expect(nodeIdLines.length).toBe(3);

        expect(nodeIdLines[0].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="100",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[0].split(' ')[1]).toBe('1');

        expect(nodeIdLines[1].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="101",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[1].split(' ')[1]).toBe('2');

        expect(nodeIdLines[2].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="undefined",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[2].split(' ')[1]).toBe('1');

        const ipLines = metrics.split('\n').filter((line: string) => line.includes('ip'));
        expect(ipLines.length).toBe(4);

        expect(ipLines[0].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.4\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[0].split(' ')[1]).toBe('1');

        expect(ipLines[1].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.5\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[1].split(' ')[1]).toBe('1');

        expect(ipLines[2].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.2\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[2].split(' ')[1]).toBe('1');

        expect(ipLines[3].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.3\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[3].split(' ')[1]).toBe('1');
    });

    it('should differentiate between same value with different type', async () => {
        data = [
            {
                node_id: 100,
                ip: '192.168.0.4'
            },
            {
                node_id: '100',
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
                node_id: '101',
                ip: '192.168.0.5'
            },
            {
                node_id: '101',
                ip: '192.168.0.2'
            },
            {
                ip: '192.168.0.3'
            }
        ];

        const testConfig = {
            prom_metrics_port: 3353,
            prom_metrics_enabled: true,
            prom_metrics_add_default: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(DataEntity.isDataEntity(doc)).toBe(true);
        });
        expect(results).toBeArrayOfSize(7);

        const metrics: string = await test.context.apis.scrapePromMetrics();
        const nodeIdLines = metrics.split('\n').filter((line: string) => line.includes('node_id'));
        expect(nodeIdLines.length).toBe(5);

        expect(nodeIdLines[0].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="100",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[0].split(' ')[1]).toBe('1');

        expect(nodeIdLines[1].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="101",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[1].split(' ')[1]).toBe('2');

        expect(nodeIdLines[2].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="undefined",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[2].split(' ')[1]).toBe('1');

        expect(nodeIdLines[3].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"100\\\"",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[3].split(' ')[1]).toBe('1');

        expect(nodeIdLines[4].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"101\\\"",field="node_id",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(nodeIdLines[4].split(' ')[1]).toBe('2');

        const ipLines = metrics.split('\n').filter((line: string) => line.includes('ip'));
        expect(ipLines.length).toBe(4);

        expect(ipLines[0].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.4\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[0].split(' ')[1]).toBe('2');

        expect(ipLines[1].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.5\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[1].split(' ')[1]).toBe('2');

        expect(ipLines[2].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.2\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[2].split(' ')[1]).toBe('2');

        expect(ipLines[3].split(' ')[0])
            .toBe('teraslice_worker_count_by_field_count_total{value="\\\"192.168.0.3\\\"",field="ip",op_name="count_by_field",name=\"mockPromMetrics\",assignment=\"worker\"}');
        expect(ipLines[3].split(' ')[1]).toBe('1');
    });
});
