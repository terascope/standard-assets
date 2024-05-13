import 'jest-extended';
import { DataEntity, cloneDeep, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import path from 'path';

describe('count_by_field processor', () => {
    let harness: WorkerTestHarness;
    let data: AnyObject[];

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

    async function makeTest(testConfig: AnyObject = {}) {
        const jobWithCollectMetrics = newTestJobConfig({
            prom_metrics_enabled: true,
            prom_metrics_port: testConfig.tf_prom_metrics_port,
            prom_metrics_add_default: testConfig.tf_prom_metrics_add_default,
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true
                },

                {
                    _op: 'count_by_field',
                    field: 'node_id',
                    collect_metrics: testConfig.tf_prom_metrics_enabled

                },
                {
                    _op: 'count_by_field',
                    field: 'ip',
                    collect_metrics: testConfig.tf_prom_metrics_enabled

                },
                {
                    _op: 'noop'
                },
            ]
        });

        harness = new WorkerTestHarness(jobWithCollectMetrics, {
            assetDir: path.join(__dirname, '../../asset'),
            cluster_manager_type: 'kubernetes'
        });

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        await harness.context.apis.foundation.promMetrics.shutdown();
        await harness.shutdown();
        await harness.flush();
    });
    afterAll(async () => {
        await harness.context.apis.foundation.promMetrics.shutdown();
        await harness.shutdown();
        await harness.flush();
    });

    it('should generate an empty result if no input data', async () => {
        const testConfig = {
            tf_prom_metrics_port: 3350,
            tf_prom_metrics_enabled: false,
            tf_prom_metrics_use_default: false
        };
        const test = await makeTest(testConfig);
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('should just pass doc when collect metrics is false', async () => {
        const testConfig = {
            tf_prom_metrics_port: 3351,
            tf_prom_metrics_enabled: false,
            tf_prom_metrics_use_default: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toBeArrayOfSize(4);
        const response = test.context.mockPromMetrics?.count_by_field_count_total;
        expect(response).toBe(undefined);
    });

    it('should include metrics when collect metrics is true', async () => {
        const testConfig = {
            tf_prom_metrics_port: 3353,
            tf_prom_metrics_enabled: true,
            tf_prom_metrics_use_default: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(DataEntity.isDataEntity(doc)).toBe(true);
        });
        expect(results).toBeArrayOfSize(4);

        const metricName = 'count_by_field_count_total';

        const response = test.context.mockPromMetrics?.[metricName];

        expect(response?.name).toEqual(metricName);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:100,'].value).toEqual(1);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:101,'].value).toEqual(2);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:undefined,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.2,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.3,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.4,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.5,'].value).toEqual(1);
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
            tf_prom_metrics_port: 3353,
            tf_prom_metrics_enabled: true,
            tf_prom_metrics_use_default: false
        };
        const test = await makeTest(testConfig);

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(DataEntity.isDataEntity(doc)).toBe(true);
        });
        expect(results).toBeArrayOfSize(7);

        const metricName = 'count_by_field_count_total';

        // console.log('@@@@ mockPromMetrics: ', test.context.mockPromMetrics);
        const response = test.context.mockPromMetrics?.[metricName];
        // console.log('@@@@ response: ', response);

        expect(response?.name).toEqual(metricName);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:100,'].value).toEqual(1);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:101,'].value).toEqual(2);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:"100",'].value).toEqual(1);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:"101",'].value).toEqual(2);
        expect(response?.labels['field:node_id,op_name:count_by_field,value:undefined,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.2,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.3,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.4,'].value).toEqual(1);
        expect(response?.labels['field:ip,op_name:count_by_field,value:192.168.0.5,'].value).toEqual(1);
    });
});
