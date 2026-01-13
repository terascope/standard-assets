import 'jest-extended';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

const defaultConfig = {
    _op: 'data_window_to_array',
    type: 'string'
};

const testData = [
    DataWindow.make('key', [{ id: 1 }, { id: 2 }, { id: 3 }]),
    DataWindow.make('key', [{ id: 4 }, { id: 5 }, { id: 6 }]),
    DataWindow.make('key', [{ id: 7 }, { id: 8 }, { id: 9 }])
];

describe('data_window_to_array', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<OpConfig> = {}) {
        const opConfig: OpConfig = Object.assign({}, defaultConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should generate an empty result if no input data', async () => {
        const test = await makeTest();
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('should add type to all the docs', async () => {
        const test = await makeTest();
        const results = await test.runSlice(testData);

        expect(results).toBeArrayOfSize(9);
        expect(results[0].id).toBe(1);
        expect(results[8].id).toBe(9);
    });
});
