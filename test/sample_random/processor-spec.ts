import { WorkerTestHarness } from 'teraslice-test-harness';
import { SampleRandomConfig } from '../../asset/src/sample_random/interfaces.js';

describe('sample_random', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<SampleRandomConfig> = {}) {
        const baseConfig = {
            _op: 'sample_random',
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

    it('with 0%, should return none the data', async () => {
        const data = makeData(10);
        harness = await makeTest({ probability_to_keep: 0 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with 50%, should return half all the data', async () => {
        const data = makeData(10);
        harness = await makeTest({ probability_to_keep: 50 });
        const results = await harness.runSlice(data);

        expect(results.length).toBeLessThan(10);
        expect(results.length).toBeGreaterThan(0);
    });

    it('with 100%, should return all data', async () => {
        const data = makeData(10);
        harness = await makeTest({ probability: 100 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('with large datasets and 95%', async () => {
        const data = makeData(10000);
        harness = await makeTest({ probability_to_keep: 95 });
        const results = await harness.runSlice(data);

        expect(results.length).toBeLessThan(9800);
        expect(results.length).toBeGreaterThan(9200);
    });

    it('with large datasets and 50%', async () => {
        const data = makeData(10000);
        harness = await makeTest({ probability_to_keep: 50 });
        const results = await harness.runSlice(data);

        expect(results.length).toBeLessThan(5400);
        expect(results.length).toBeGreaterThan(4600);
    });

    it('with large datasets and 0%', async () => {
        const data = makeData(10000);
        harness = await makeTest({ probability_to_keep: 0 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
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
