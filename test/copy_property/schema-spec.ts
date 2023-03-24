import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject, OpConfig } from '@terascope/job-components';

describe('copy_property schema', () => {
    let harness: WorkerTestHarness;
    const name = 'copy_property';

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
        await expect(makeSchema({ source: 'some_source' })).toReject();
        await expect(makeSchema({ destination: 'some_destination' })).toReject();
    });
});
