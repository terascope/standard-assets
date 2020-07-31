import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';

describe('remove_key schema', () => {
    let harness: WorkerTestHarness;
    const name = 'remove_key';

    async function makeSchema(config: AnyObject = {}): Promise<AnyObject> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as AnyObject;
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
