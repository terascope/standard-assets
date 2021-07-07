import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { JobMetricAPIConfig } from '../../asset/src/job_metric_api/interfaces';

describe('job_metric_api schema', () => {
    let harness: WorkerTestHarness;
    const name = 'metric-api';

    async function makeSchema(config: AnyObject = {}): Promise<JobMetricAPIConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );
        return validConfig as unknown as JobMetricAPIConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({ type: { some: 'test' } })).toReject();
        await expect(makeSchema({})).toReject();
    });
});
