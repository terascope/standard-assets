import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('add_key schema', () => {
    let harness: WorkerTestHarness;
    const name = 'add_key';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<OpConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name }, config);
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
        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ key_name: 'test' })).toResolve();
        await expect(makeSchema({ hash_algorithm: 'sha256' })).toResolve();
        await expect(makeSchema({ hash_algorithm: 'none' })).toReject();
    });
});
