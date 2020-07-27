import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { DataGenerator } from '../../asset/src/data_generator/interfaces';

describe('data-generator schema', () => {
    let harness: WorkerTestHarness;

    async function makeSchema(config: AnyObject = {}): Promise<DataGenerator> {
        const name = 'data_generator';
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testFetcher(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return accumConfig as DataGenerator;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toBeDefined();
        expect(schema.json_schema).toBeNull();
        expect(schema.start).toBeNull();
        expect(schema.end).toBeNull();
        expect(schema.format).toBeNull();
        expect(schema.set_id).toBeNull();
        expect(schema.id_start_key).toBeNull();
        expect(schema.stress_test).toBeFalse();
        expect(schema.date_key).toEqual('created');
        expect(schema.size).toEqual(5000);
    });

    it('should throw with bad values', async () => {
        await expect(makeSchema({ size: -234234 })).toReject();
        await expect(makeSchema({ id_start_key: 'a' })).toReject();
        await expect(makeSchema({ id_start_key: 'a', set_id: 'other' })).toReject();

        await expect(makeSchema({ json_schema: 12341234 })).toReject();
        await expect(makeSchema({ start: 'asdf987asdf' })).toReject();
        await expect(makeSchema({ end: 'asdf987asdf' })).toReject();
        await expect(makeSchema({ format: 12341234 })).toReject();
    });

    it('should throw if start is later than end', async () => {
        const date = new Date().getTime();
        const start = new Date(date + 1000000);
        const end = new Date(date);

        await expect(makeSchema({ start, end })).toReject();
    });
});
