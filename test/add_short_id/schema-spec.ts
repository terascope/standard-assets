import 'jest-extended';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('remove_key schema', () => {
    let harness: WorkerTestHarness;
    const name = 'add_short_id';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<OpConfig> {
        const opConfig: OpConfig = { _op: name, ...config };

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
            // eslint-disable-next-line no-regex-spaces
        })).rejects.toThrow(/Validation failed for operation config: add_short_id - Zod parse error:[\s\S]+dictionary value must be one of number,alpha,alpha_lower,alpha_upper,alphanum,alphanum_lower,alphanum_upper,hex.  Input was random stuff/s);
    });

    it('should throw if field is not defined', async () => {
        await expect(makeSchema({
            _op: name
        })).rejects.toThrow(/Validation failed for operation config: add_short_id - Zod parse error:[\s\S]+This field is required and must be of type string/s);
    });
});
