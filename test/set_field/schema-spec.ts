import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('set_field schema', () => {
    let harness: WorkerTestHarness;
    const name = 'set_field';

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
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ field: 'name' })).toReject();
        await expect(makeSchema({ value: 'bob' })).toReject();
        await expect(makeSchema({ field: 'name', value: 'bob' })).toResolve();
        await expect(makeSchema({ field: 'name', value: 'bob', overwrite: true })).toResolve();
    });
});
