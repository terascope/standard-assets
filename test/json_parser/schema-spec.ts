import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

// TODO: check check if api name is real and available

describe('json_parser schema', () => {
    let harness: WorkerTestHarness;
    const name = 'json_parser';

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
        await expect(makeSchema({ _dead_letter_action: ['some stuff'] })).toReject();
        await expect(makeSchema({ _dead_letter_action: 1234 })).toReject();

        await expect(makeSchema({ _dead_letter_action: 'none' })).toResolve();
        await expect(makeSchema({ _dead_letter_action: 'some_api_name' })).toResolve();
    });
});
