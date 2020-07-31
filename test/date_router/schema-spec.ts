import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { DateRouterConfig, DateResolution } from '../../asset/src/date_router/interfaces';

describe('date_router schema', () => {
    let harness: WorkerTestHarness;
    const name = 'date_router';

    async function makeSchema(config: AnyObject = {}): Promise<DateRouterConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as DateRouterConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema({ field: 'test' });

        expect(schema).toBeDefined();
        expect(schema.field).toEqual('test');
        expect(schema.resolution).toEqual(DateResolution.daily);
        expect(schema.field_delimiter).toEqual('-');
        expect(schema.value_delimiter).toEqual('_');
    });

    it('should throw with bad values', async () => {
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ field: 'test', resolution: 1234 })).toReject();
        await expect(makeSchema({ field: 'test', field_delimiter: 1234 })).toReject();
        await expect(makeSchema({ field: 'test', value_delimiter: 1234 })).toReject();
    });
});
