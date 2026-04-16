import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SlicerRecoveryData, LifeCycle } from '@terascope/job-components';
import { SlicerTestHarness, newTestJobConfig } from 'teraslice-test-harness';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const testAssetPath = path.join(dirname, '../fixtures/someAssetId');
const opPathName = path.join(dirname, '../../asset/');
const assetDir = [testAssetPath, opPathName];

interface SlicerTestArgs {
    opConfig: any;
    numOfSlicers?: number;
    recoveryData?: SlicerRecoveryData[];
    lifecycle?: LifeCycle;
    size?: number;
    apis?: any[];
    apiName?: string;
}

describe('data_generator slicer', () => {
    let harness: SlicerTestHarness;
    let clients: any;

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeSlicerTest({
        opConfig,
        numOfSlicers = 1,
        recoveryData,
        lifecycle = 'once',
        size,
        apis,
        apiName
    }: SlicerTestArgs) {
        const job = newTestJobConfig({
            analytics: true,
            slicers: numOfSlicers,
            lifecycle,
            operations: [
                opConfig,
                { _op: 'noop', size, ...(apiName && { _api_name: apiName }) }
            ],
            ...(apis && { apis }),
        });
        harness = new SlicerTestHarness(job, { clients, assetDir });
        await harness.initialize(recoveryData);
        return harness;
    }

    it('in "once" mode will return number based off total size of last op', async () => {
        const opConfig = { _op: 'data_generator', size: 15 };
        const config: SlicerTestArgs = {
            opConfig,
            numOfSlicers: 1,
            size: 5
        };

        const test = await makeSlicerTest(config);

        const [slice1] = await test.createSlices();
        expect(slice1).toEqual({ count: 5, processed: 5 });

        const [slice2] = await test.createSlices();
        expect(slice2).toEqual({ count: 5, processed: 10 });

        const [slice3] = await test.createSlices();
        expect(slice3).toEqual({ count: 5, processed: 15 });

        const [slice4] = await test.createSlices();
        expect(slice4).toEqual(null);
    });

    it('in "once" mode can deal with uneven slice numbers', async () => {
        const opConfig = { _op: 'data_generator', size: 12 };
        const config: SlicerTestArgs = {
            opConfig,
            numOfSlicers: 1,
            size: 5
        };
        const test = await makeSlicerTest(config);

        const [slice1] = await test.createSlices();
        expect(slice1).toEqual({ count: 5, processed: 5 });

        const [slice2] = await test.createSlices();
        expect(slice2).toEqual({ count: 5, processed: 10 });

        const [slice3] = await test.createSlices();
        expect(slice3).toEqual({ count: 2, processed: 12 });

        const [slice4] = await test.createSlices();
        expect(slice4).toEqual(null);
    });

    it('can run recovery in once mode', async () => {
        const opConfig = { _op: 'data_generator', size: 15 };
        const config: SlicerTestArgs = {
            opConfig,
            numOfSlicers: 1,
            recoveryData: [{ lastSlice: { count: 5, processed: 5 }, slicer_id: 0 }],
            size: 5
        };
        const test = await makeSlicerTest(config);

        const [slice1] = await test.createSlices();
        expect(slice1).toEqual({ count: 5, processed: 10 });

        const [slice2] = await test.createSlices();
        expect(slice2).toEqual({ count: 5, processed: 15 });

        const [slice3] = await test.createSlices();
        expect(slice3).toEqual(null);
    });

    it('in "once" mode will return number based off total size, which can consume it all', async () => {
        const opConfig = { _op: 'data_generator', size: 15 };
        const config: SlicerTestArgs = {
            opConfig,
            numOfSlicers: 1,
            size: 5000
        };
        const test = await makeSlicerTest(config);

        const [slice1] = await test.createSlices();
        expect(slice1).toEqual({ count: 15, processed: 15 });

        const [slice2] = await test.createSlices();
        expect(slice2).toEqual(null);

        const [slice3] = await test.createSlices();
        expect(slice3).toEqual(null);

        const [slice4] = await test.createSlices();
        expect(slice4).toEqual(null);
    });

    it('slicer in "persistent" mode will continuously produce the same number', async () => {
        const opConfig = { _op: 'data_generator', size: 550 };
        const config: SlicerTestArgs = {
            lifecycle: 'persistent',
            numOfSlicers: 1,
            opConfig,
            size: 5000
        };
        const testHarness = await makeSlicerTest(config);

        const results1 = await testHarness.createSlices();
        const results2 = await testHarness.createSlices();
        const results3 = await testHarness.createSlices();

        expect(results1).toEqual([{ count: 5000, processed: 5000 }]);
        expect(results2).toEqual([{ count: 5000, processed: 10000 }]);
        expect(results3).toEqual([{ count: 5000, processed: 15000 }]);
    });

    it('slicer in "persistent" mode will prioritize lastOp.size over lastOpApis.size', async () => {
        const opConfig = { _op: 'data_generator', size: 550 };
        const apiName = 'test_api';
        const apiSize = 10000;
        const opSize = 5000;

        const config: SlicerTestArgs = {
            lifecycle: 'persistent',
            numOfSlicers: 1,
            opConfig,
            size: opSize,
            apis: [{ _name: apiName, size: apiSize }],
            apiName
        };
        const testHarness = await makeSlicerTest(config);

        const results1 = await testHarness.createSlices();
        const results2 = await testHarness.createSlices();
        const results3 = await testHarness.createSlices();

        expect(results1).toEqual([{ count: 5000, processed: 5000 }]);
        expect(results2).toEqual([{ count: 5000, processed: 10000 }]);
        expect(results3).toEqual([{ count: 5000, processed: 15000 }]);
    });

    it('slicer in "persistent" mode will prioritize lastOpApis.size over opConfig.size', async () => {
        const opConfig = { _op: 'data_generator', size: 550 };
        const apiName = 'test_api';
        const apiSize = 1000;

        const config: SlicerTestArgs = {
            lifecycle: 'persistent',
            numOfSlicers: 1,
            opConfig,
            apis: [{ _name: apiName, size: apiSize }],
            apiName
        };
        const testHarness = await makeSlicerTest(config);

        const results1 = await testHarness.createSlices();
        const results2 = await testHarness.createSlices();
        const results3 = await testHarness.createSlices();

        expect(results1).toEqual([{ count: 1000, processed: 1000 }]);
        expect(results2).toEqual([{ count: 1000, processed: 2000 }]);
        expect(results3).toEqual([{ count: 1000, processed: 3000 }]);
    });

    it('slicer in "persistent" mode will produce opConfig.size records per slice if lastOp and lastOpApi have no size', async () => {
        const opConfig = { _op: 'data_generator', size: 550 };
        const config: SlicerTestArgs = {
            lifecycle: 'persistent',
            numOfSlicers: 1,
            opConfig
        };
        const testHarness = await makeSlicerTest(config);

        const results1 = await testHarness.createSlices();
        const results2 = await testHarness.createSlices();
        const results3 = await testHarness.createSlices();

        expect(results1).toEqual([{ count: 550, processed: 550 }]);
        expect(results2).toEqual([{ count: 550, processed: 1100 }]);
        expect(results3).toEqual([{ count: 550, processed: 1650 }]);
    });

    it('data generator will only return one slicer', async () => {
        const opConfig = { _op: 'data_generator', size: 550 };
        const config: SlicerTestArgs = {
            lifecycle: 'persistent',
            numOfSlicers: 3,
            opConfig,
            size: 5000
        };
        const testHarness = await makeSlicerTest(config);
        const slicer = testHarness.slicer();

        expect(slicer.slicers()).toEqual(1);
    });
});
