import 'jest-extended';
import { AnyObject, DataEntity } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { IDType, DateOptions } from '../../asset/src/data_generator/interfaces';

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

    it('should return data from default schema', async () => {
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
    });

    it('should build an id if config is set', async () => {
        const test = await makeFetcherTest({ set_id: IDType.base64url });
        const [data] = await test.runSlice({ count: 1 });

        expect(data.id).toBeString();
    });

    it('should build an id and set starting key', async () => {
        const key = 'a';
        const test = await makeFetcherTest({ set_id: IDType.base64url, id_start_key: key });
        const [data] = await test.runSlice({ count: 1 });

        expect(data.id).toBeString();
        expect(data.id.charAt(0)).toEqual(key);
    });

    it('should produce dates of now', async () => {
        const field = 'test';
        const timeStart = new Date().getTime();

        const test = await makeFetcherTest({ format: DateOptions.dateNow, date_key: field });
        const [data] = await test.runSlice({ count: 1 });

        const generatedTime = new Date(data[field]).getTime();
        const timeEnd = new Date().getTime();

        expect(data).not.toHaveProperty('created');
        expect(data.field).toBeString();

        const expression = timeStart <= generatedTime && generatedTime <= timeEnd;
        expect(expression).toBeTrue();
    });

    it('should produce dates of between', async () => {
        const field = 'test';
        const timeStart = new Date().getTime() + 100000;
        const timeEnd = new Date(timeStart).getTime() + 200000;

        const test = await makeFetcherTest({
            format: DateOptions.dateNow,
            date_key: field,
            start: timeStart,
            end: timeEnd
        });

        const [data] = await test.runSlice({ count: 1 });

        const generatedTime = new Date(data[field]).getTime();

        expect(data).not.toHaveProperty('created');
        expect(data.field).toBeString();

        const expression = timeStart <= generatedTime && generatedTime <= timeEnd;
        expect(expression).toBeTrue();
    });
});
