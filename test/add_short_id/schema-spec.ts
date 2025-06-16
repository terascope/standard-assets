import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';

describe('remove_key schema', () => {
    let harness: WorkerTestHarness;
    const name = 'add_short_id';

    async function makeSchema(config: AnyObject = {}): Promise<AnyObject> {
        const opConfig = { _op: name, ...config };

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
        const schema = await makeSchema({
            _op: name,
            field: 'id_field'
        });

        expect(schema).toMatchObject({
            _op: name,
            _encoding: 'json',
            _dead_letter_action: 'throw'
        });
    });

    it('should throw if dictionary is not in the specified list', async () => {
        await expect(makeSchema({
            _op: name,
            field: 'id_field',
            dictionary: 'random stuff'
        })).rejects.toThrow('Validation failed for operation config: add_short_id - dictionary: dictionary value must be one of number,alpha,alpha_lower,alpha_upper,alphanum,alphanum_lower,alphanum_upper,hex.  Input was random stuff: value was "random stuff"');
    });

    it('should throw if field is not defined', async () => {
        await expect(makeSchema({
            _op: name
        })).rejects.toThrow('Validation failed for operation config: add_short_id - field: This field is required and must by of type string');
    });
});
