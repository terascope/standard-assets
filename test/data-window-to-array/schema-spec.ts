import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';

describe('data_window_to_array schema', () => {
    let harness: WorkerTestHarness;
    const name = 'data_window_to_array';

    async function makeSchema(config: AnyObject = {}): Promise<AnyObject> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return accumConfig as AnyObject;
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
