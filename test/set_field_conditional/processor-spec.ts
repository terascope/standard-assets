import { WorkerTestHarness } from 'teraslice-test-harness';
import { SetFieldConditionalConfig } from '../../asset/src/set_field_conditional/interfaces.js';

const testData = [
    {
        id: 1,
        type: 'data1'
    },
    {
        id: 2,
        type: 'data2'
    },
    {
        id: 3,
        type: 'data3'
    }
];

const testData2 = [
    {
        id: 1,
        test_prop: 'value'
    },
    {
        id: 2,
        test_prop: 10
    },
    {
        id: 3,
        test_prop: 100
    },
    {
        id: 4,
        test_prop: 1000,
        type: 'data3'
    }
];

describe('set_field_conditional', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<SetFieldConditionalConfig> = {}) {
        const baseConfig = {
            _op: 'set_field_conditional',
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    const valueCheckOpConfig = {
        _op: 'set_field_conditional',
        conditional_field: 'type',
        conditional_values: ['data1', 'data2'],
        set_field: 'test_prop',
        value: true
    };

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('generate an empty result if no input data', async () => {
        harness = await makeTest(valueCheckOpConfig);
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('should correctly set the field in all records with type:data1 and type:data2', async () => {
        harness = await makeTest(valueCheckOpConfig);
        const results = await harness.runSlice(testData);

        expect(results[0].test_prop).toBe(true);
        expect(results[1].test_prop).toBe(true);
    });

    it('should not update fields that do not match conditional_values', async () => {
        harness = await makeTest(valueCheckOpConfig);
        const results = await harness.runSlice(testData2);

        expect(results[0].test_prop).toBe('value');
        expect(results[1].test_prop).toBe(10);
        expect(results[2].test_prop).toBe(100);
    });
});
