import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('copy_metadata_field schema', () => {
    let harness: WorkerTestHarness;
    const name = 'copy_metadata_field';

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
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ destination: ['some stuff'] })).toReject();
        await expect(makeSchema({ destination: 'some_destination', meta_key: true })).toReject();
        await expect(makeSchema({ destination: true, source: 'field' })).toReject();
        await expect(makeSchema({ destination: 'true', meta_key: 1234 })).toReject();

        await expect(makeSchema({ destination: 'someField' })).toResolve();
        await expect(makeSchema({ destination: 'someField', meta_key: 'some_key' })).toResolve();
    });
});
