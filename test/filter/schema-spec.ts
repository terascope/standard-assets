import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('filter schema', () => {
    let harness: WorkerTestHarness;
    const name = 'filter';

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
        await expect(makeSchema({ field: 1234 })).toReject();
        await expect(makeSchema({ field: 'some_destination', invert: 1234 })).toReject();
        await expect(makeSchema({ array_index: true, field: 'field' })).toReject();
        await expect(makeSchema({ field: 'field', filter_by: 'field' })).toReject();
        await expect(makeSchema({ field: 'field', validation_function: 'field' })).toReject();

        await expect(makeSchema({
            field: [1234, 'last_name'],
            value: 'ray',
            invert: true
        })).toReject();

        await expect(makeSchema({
            field: undefined,
            value: 'ray',
            invert: true
        })).toReject();

        await expect(makeSchema({
            field: 'name',
            value: 'ran',
            exception_rules: [
                { field: 'favorite_baseball_team', regex: true }
            ]
        })).toReject();

        await expect(makeSchema({ field: 'someField' })).toResolve();
        await expect(makeSchema({ field: 'someField', meta_key: 'some_key' })).toResolve();
    });
});
