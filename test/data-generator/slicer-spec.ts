/* eslint-disable @typescript-eslint/no-unused-vars */

import { SlicerRecoveryData, LifeCycle } from '@terascope/job-components';
import { SlicerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import path from 'path';

interface SlicerTestArgs {
    opConfig: any;
    numOfSlicers?: number;
    recoveryData?: SlicerRecoveryData[];
    lifecycle?: LifeCycle;
    size: number;
}

describe('data_generator slicer', () => {
    const assetDir = path.join(__dirname, '..');
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
        size
    }: SlicerTestArgs) {
        const job = newTestJobConfig({
            analytics: true,
            slicers: numOfSlicers,
            lifecycle,
            operations: [
                opConfig,
                {
                    _op: 'noop',
                    size
                }
            ],
        });
        harness = new SlicerTestHarness(job, { assetDir, clients });
        await harness.initialize(recoveryData);
        return harness;
    }

    it('in "once" mode will return number based off total size of last op', async () => {
        const opConfig = { _op: 'elasticsearch_data_generator', size: 15 };
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
        const opConfig = { _op: 'elasticsearch_data_generator', size: 12 };
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
        const opConfig = { _op: 'elasticsearch_data_generator', size: 15 };
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
        const opConfig = { _op: 'elasticsearch_data_generator', size: 15 };
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
        const opConfig = { _op: 'elasticsearch_data_generator', size: 550 };
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

    it('data generator will only return one slicer', async () => {
        const opConfig = { _op: 'elasticsearch_data_generator', size: 550 };
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
