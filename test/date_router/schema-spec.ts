import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/types';
import { DateRouterConfig, DateResolution } from '@terascope/standard-asset-apis';

describe('date_router schema', () => {
    let harness: WorkerTestHarness;
    const name = 'date_router';

    async function makeSchema(
        config: Partial<DateRouterConfig> = {}
    ): Promise<DateRouterConfig & OpConfig> {
        const opConfig = Object.assign(
            {}, { _op: name }, config as DateRouterConfig
        );
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as DateRouterConfig & OpConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema({ field: 'test' });

        expect(schema).toBeDefined();
        expect(schema.field).toEqual('test');
        expect(schema.resolution).toEqual(DateResolution.daily);
        expect(schema.date_delimiter).toEqual('.');
        expect(schema.date_unit_delimiter).toEqual('_');
    });

    it('should throw with bad values', async () => {
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ field: 'test', resolution: 1234 as any })).toReject();
        await expect(makeSchema({ field: 'test', date_delimiter: 1234 as any })).toReject();
        await expect(makeSchema({ field: 'test', date_unit_delimiter: 1234 as any })).toReject();
        await expect(makeSchema({ field: 'test', date_delimiter: ':' })).toReject();
        await expect(makeSchema({ field: 'test', date_unit_delimiter: '*' })).toReject();
        await expect(makeSchema({ field: 'test', date_unit_delimiter: ' ' })).toReject();
    });
});
