import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject, OpConfig } from '@terascope/job-components';

describe('copy_field schema', () => {
    let harness: WorkerTestHarness;
    const name = 'copy_field';

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
        await expect(makeSchema({ source: 'some_source', destination: 'some_destination' })).toResolve();
        await expect(makeSchema({ source: 'some_source', destination: 'some_destination', delete_source: true })).toResolve();
        await expect(makeSchema({ destination: true, source: 'field' })).toReject();
        await expect(makeSchema({ destination: 'true', source: 1234 })).toReject();
    });
});
