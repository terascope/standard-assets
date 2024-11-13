import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('sample_random schema', () => {
    let harness: WorkerTestHarness;
    const name = 'sample_random';

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
        await expect(makeSchema({ probability_to_keep: 1234 })).toReject();
        await expect(makeSchema({ probability_to_keep: ['some stuff'] })).toReject();
        await expect(makeSchema({ probability_to_keep: null })).toReject();

        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ probability_to_keep: 50 })).toResolve();
    });
});
