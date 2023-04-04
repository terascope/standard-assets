import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject, OpConfig } from '@terascope/job-components';

describe('drop_field schema', () => {
    let harness: WorkerTestHarness;
    const name = 'drop_field';

    async function makeSchema(config: AnyObject = {}): Promise<OpConfig> {
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
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ field: 'name' })).toResolve();
        await expect(makeSchema({ field: ['name', 'age', 'height'] })).toResolve();
        await expect(makeSchema({ field: ['name', 'age', 1234] })).toReject();
        await expect(makeSchema({ field: true })).toReject();
    });
});
