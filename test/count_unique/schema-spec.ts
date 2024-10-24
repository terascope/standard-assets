import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('count_unique schema', () => {
    let harness: WorkerTestHarness;
    const name = 'count_unique';

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
        await expect(makeSchema({ field: 1234 })).toReject();
        await expect(makeSchema({ field: ['some stuff'] })).toReject();
        await expect(makeSchema({ field: 'true', preserve_fields: 1234 })).toReject();
        await expect(makeSchema({ field: 'true', preserve_fields: [1234] })).toReject();

        await expect(makeSchema({ preserve_fields: ['someField'] })).toResolve();
        await expect(makeSchema({ field: 'someField' })).toResolve();
        await expect(makeSchema({ field: 'someField', preserve_fields: ['someField', 'otherField'] })).toResolve();
    });
});
