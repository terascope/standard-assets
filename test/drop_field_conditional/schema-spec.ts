import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('drop_field schema', () => {
    let harness: WorkerTestHarness;
    const name = 'drop_field_conditional';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<OpConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name, field: 'name' }, config);
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

    it('should expect only one conditional, regex or validation', async () => {
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ regex: 'someregex', validation_method: 'isString' })).toReject();
        await expect(makeSchema({ regex: 'someregex', validation_args: 'some args' })).toReject();
    });

    it('should expect the regex to be properly formated', async () => {
        await expect(makeSchema({ regex: '/good\\.+regex/msu' })).toResolve();

        await expect(makeSchema({ regex: 1928 })).toReject();
        await expect(makeSchema({ regex: 'somebad rejex' })).toReject();
        await expect(makeSchema({ regex: '/good\\.+regex/badflags' })).toReject();
        await expect(makeSchema({ regex: 'good\\.+regex/badflags' })).toReject();
        await expect(makeSchema({ regex: '/good\\.+regex' })).toReject();
    });

    it('should expect validation method to be valid with acceptable args', async () => {
        await expect(makeSchema({ validation_method: 'isString' })).toResolve();
        await expect(makeSchema({ validation_method: 'badMethod' })).toReject();
        await expect(makeSchema({ validation_args: 'some args' })).toReject();
        await expect(makeSchema({
            validation_method: 'inNumberRange',
            validation_args: { min: 102, max: 2048 }
        })).toResolve();
        await expect(makeSchema({
            validation_method: 'inNumberRange',
            validation_args: 'min - 102, max - 434'
        })).toReject();
    });
});
