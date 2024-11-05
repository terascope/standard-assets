import { WorkerTestHarness } from 'teraslice-test-harness';
import { SampleExactConfig } from '../../asset/src/sample_exact/interfaces.js';

describe('sample_exact', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<SampleExactConfig> = {}) {
        const baseConfig = {
            _op: 'sample_exact',
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('with default settings, should return empty array from empty array', async () => {
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results).toEqual([]);
    });

    it('with default settings, should return all the data', async () => {
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('shuffles the data', async () => {
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        const outOfOrder = results.some((record, index) => {
            return record._key !== data[index]._key;
        });

        expect(outOfOrder).toBeTrue();
    });

    it('with 0%, should return none of the data', async () => {
        const data = makeData(10);
        harness = await makeTest({ percent_kept: 0 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with 50%, should return half all the data', async () => {
        const data = makeData(10);
        harness = await makeTest({ percent_kept: 50 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(5);
    });

    it('with 100%, should return all data', async () => {
        const data = makeData(10);
        harness = await makeTest({ percent_kept: 100 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('with small data, and a high enough percentage, will return 0', async () => {
        const data = makeData(3);
        harness = await makeTest({ percent_kept: 25 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with large datasets and 95%', async () => {
        const data = makeData(10000);
        harness = await makeTest({ percent_kept: 95 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(9500);
    });

    it('with large datasets and 50%', async () => {
        const data = makeData(10000);
        harness = await makeTest({ percent_kept: 50 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(5000);
    });
});

interface FakeData {
    _key: number;
    name: string;
    age: string;
}

function makeData(n: number): FakeData[] {
    const bunchesOData = [];

    for (let i = 0; i < n; i++) {
        bunchesOData.push({
            _key: i,
            name: 'name',
            age: 'age'
        });
    }

    return bunchesOData;
}
