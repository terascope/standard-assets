import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { AccumulateByKeyConfig } from '../../asset/src/accumulate_by_key/interfaces';

describe('accumulate', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: AnyObject = {}): Promise<AccumulateByKeyConfig> {
        const name = 'accumulate_by_key';
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return accumConfig as AccumulateByKeyConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.empty_after).toEqual(10);
        expect(schema.flush_data_on_shutdown).toBeFalse();
        expect(schema.key_field).toBeUndefined();
        expect(schema.batch_return).toBeFalse();
        expect(schema.batch_size).toEqual(1000);
    });

    it('should throw with bad values', async () => {
        await expect(makeSchema({ empty_after: null })).toReject();
        await expect(makeSchema({ empty_after: [] })).toReject();
        await expect(makeSchema({ flush_data_on_shutdown: 12341234 })).toReject();
        await expect(makeSchema({ batch_return: [12341234] })).toReject();
        await expect(makeSchema({ batch_size: null })).toReject();
        await expect(makeSchema({ key_field: null })).toReject();
    });
});
