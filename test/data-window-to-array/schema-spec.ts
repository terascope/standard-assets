import 'jest-extended';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('data_window_to_array schema', () => {
    let harness: WorkerTestHarness;
    const name = 'data_window_to_array';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<OpConfig> {
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

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toMatchObject({
            _op: name,
            _encoding: 'json',
            _dead_letter_action: 'throw'
        });
    });
});
