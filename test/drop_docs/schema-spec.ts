import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('drop_docs schema', () => {
    let harness: WorkerTestHarness;
    const name = 'drop_docs';

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
        await expect(makeSchema({ percentage: 1234 })).toReject();
        await expect(makeSchema({ percentage: ['some stuff'] })).toReject();
        await expect(makeSchema({ percentage: null })).toReject();
        await expect(makeSchema({ shuffle: null })).toReject();
        await expect(makeSchema({ shuffle: 1234 })).toReject();

        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ percentage: 50 })).toResolve();
        await expect(makeSchema({ shuffle: true })).toResolve();
        await expect(makeSchema({ percentage: 50, shuffle: true })).toResolve();

    });
});
