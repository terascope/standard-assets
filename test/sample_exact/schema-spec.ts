import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('sample_exact schema', () => {
    let harness: WorkerTestHarness;
    const name = 'sample_exact';

    async function makeSchema(config: Record<string, any> = {}): Promise<OpConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as OpConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({ percent_kept: 1234 })).toReject();
        await expect(makeSchema({ percent_kept: ['some stuff'] })).toReject();
        await expect(makeSchema({ percent_kept: null })).toReject();

        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ percent_kept: 50 })).toResolve();
    });
});
