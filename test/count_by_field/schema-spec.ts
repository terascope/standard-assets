import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { CountByFieldConfig } from '../../asset/src/count_by_field/interfaces';

describe('count_by_field schema', () => {
    let harness: WorkerTestHarness;
    const name = 'count_by_field';

    async function makeSchema(config: AnyObject = {}): Promise<CountByFieldConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as CountByFieldConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        expect(await makeSchema({ field: 'node_id' })).toStrictEqual({
            _dead_letter_action: 'throw',
            _encoding: 'json',
            _op: 'count_by_field',
            collect_metrics: false,
            field: 'node_id',
            metric_api_name: 'job_metric_api',
        });
        expect(await makeSchema({ field: 'node_id' })).toStrictEqual({
            _dead_letter_action: 'throw',
            _encoding: 'json',
            _op: 'count_by_field',
            collect_metrics: false,
            field: 'node_id',
            metric_api_name: 'job_metric_api',
        });
        await expect(makeSchema({ field: 12341234 })).toReject();
        await expect(makeSchema({ field: { node_id: '1234' } })).toReject();
    });
});
