
import 'jest-extended';
import { OpTestHarness } from 'teraslice-test-harness';
import DataWindow from '../asset/src/helpers/data-window';
import Processor from '../asset/src/data_window_to_array/processor';
import Schema from '../asset/src/data_window_to_array/schema';

const opConfig = {
    _op: 'data_window_to_array',
    type: 'string'
};

const testData = [
    DataWindow.make('key', [{ id: 1 }, { id: 2 }, { id: 3 }]),
    DataWindow.make('key', [{ id: 4 }, { id: 5 }, { id: 6 }]),
    DataWindow.make('key', [{ id: 7 }, { id: 8 }, { id: 9 }])
];

describe('data_window_to_array should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        // @ts-ignore FIXME:
        await testHarness.initialize({ opConfig });
    });
    afterAll(() => testHarness.shutdown());

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('add type to all the docs', async () => {
        const results = await testHarness.run(testData);
        expect(results).toBeArrayOfSize(9);
        // @ts-ignore FIXME:
        expect(results[0].id).toBe(1);
        // @ts-ignore FIXME:
        expect(results[8].id).toBe(9);
    });
});
