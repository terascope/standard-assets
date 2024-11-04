import { WorkerTestHarness } from 'teraslice-test-harness';
import { DataEntity } from '@terascope/job-components';
import { SampleConfig } from '../../asset/src/sample/interfaces.js';

describe('sample', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<SampleConfig> = {}) {
        const baseConfig = {
            _op: 'sample',
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

    it('with 0%, should return all the data', async () => {
        const data = makeData(10);
        harness = await makeTest({ percentage: 0 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('with 50%, should return half all the data', async () => {
        const data = makeData(10);
        harness = await makeTest({ percentage: 50 });
        const results = await harness.runSlice(data);

        expect(results.length).toBeLessThan(10);
        expect(results.length).toBeGreaterThan(0);
    });

    it('with 100%, should return no data', async () => {
        const data = makeData(10);
        harness = await makeTest({ percentage: 100 });
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with large datasets and 95%', async () => {
        const data = makeData(10000);
        harness = await makeTest({ percentage: 95 });
        const results = await harness.runSlice(data);

        expect(results.length).toBeLessThan(600);
        expect(results.length).toBeGreaterThan(400);
    });

    it('with large datasets and 50%', async () => {
        const data = makeData(10000);
        harness = await makeTest({ percentage: 50 });
        const results = await harness.runSlice(data);

        expect(results.length).toBeLessThan(5200);
        expect(results.length).toBeGreaterThan(4800);
    });

    it('with shuffle set to true, will move records around', async () => {
        const data = makeData(100);
        harness = await makeTest({ shuffle: true });
        const results = await harness.runSlice(data);

        expect(results).toHaveLength(100);
        expect(getKeys(data) !== getKeys(results)).toBe(true);
    });
});

interface FakeData {
    _key: number;
    name: string;
    age: string;
}

function getKeys(data: FakeData[] | DataEntity<FakeData>[]) {
    return data.map((doc) => doc._key).join('');
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
