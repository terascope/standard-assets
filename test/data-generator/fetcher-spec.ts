import 'jest-extended';
import { AnyObject, DataEntity } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('data_generator fetcher', () => {
    let harness: WorkerTestHarness;

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeFetcherTest(config: AnyObject = {}) {
        const opConfig = Object.assign({}, { _op: 'data_generator' }, config);
        harness = WorkerTestHarness.testFetcher(opConfig);
        await harness.initialize();
        return harness;
    }

    it('should produces generated data', async () => {
        const test = await makeFetcherTest();
        const results = await test.runSlice({ count: 1 });

        expect(results.length).toEqual(1);
        expect(Object.keys(results[0]).length).toBeGreaterThan(1);
    });

    fit('should return data from default schema', async () => {
        const test = await makeFetcherTest();
        const [data] = await test.runSlice({ count: 1 });

        expect(DataEntity.isDataEntity(data)).toBeTrue();
        expect(data.ip).toBeString();
        expect(data.userAgent).toBeString();
        expect(data.uuid).toBeString();
        expect(data.created).toBeString();
        expect(data.ipv6).toBeString();
        expect(data.location).toBeString();
        expect(data.bytes).toBeNumber();
        console.log('meta', data.getMetadata())
    });

    // TODO: add more tests
});
