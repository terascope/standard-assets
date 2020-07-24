import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { AccumulateConfig } from '../../asset/src/accumulate/interfaces';

describe('accumulate', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: AnyObject = {}): Promise<AccumulateConfig> {
        const opConfig = Object.assign({}, { _op: 'accumulate' }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === 'accumulate'
        );

        return accumConfig as AccumulateConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.empty_after).toEqual(10);
        expect(schema.flush_data_on_shutdown).toBeFalse();
    });

    it('should throw with bad values', async () => {
        await expect(makeSchema({ empty_after: 'aserż8ad' })).toReject();
        await expect(makeSchema({ empty_after: [] })).toReject();
        await expect(makeSchema({ flush_data_on_shutdown: 12341234 })).toReject();
    });
});
