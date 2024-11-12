import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('set_field_conditional schema', () => {
    let harness: WorkerTestHarness;
    const name = 'set_field_conditional';

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
        await expect(makeSchema({ conditional_name: 1234 })).toReject();
        await expect(makeSchema({ conditional_name: 1234, set_field: 'world' })).toReject();
        await expect(makeSchema({ conditional_name: 'hello', set_field: 1234 })).toReject();

        await expect(makeSchema({ conditional_name: 'hello', set_field: 'world' })).toResolve();
        await expect(makeSchema({
            conditional_name: 'hello',
            set_field: 'world',
            conditional_values: [null],
            value: true,
        })).toResolve();
    });
});
