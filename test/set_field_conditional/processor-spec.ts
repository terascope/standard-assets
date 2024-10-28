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
            _op: 'drop_docs',
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    const valueCheckOpConfig = {
        _op: 'set_field_conditional',
        check_name: 'type',
        check_values: ['data1', 'data2'],
        set_name: 'test_prop',
        set_value: true
    };

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('generate an empty result if no input data', async () => {
        const harness = await makeTest(valueCheckOpConfig);
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('should correctly set the field in all records with type:data1 and type:data2', async () => {
        const harness = await makeTest(valueCheckOpConfig);
        const results = await harness.runSlice(testData);

        expect(results[0].test_prop).toBe(true);
        expect(results[1].test_prop).toBe(true);
    });

    it('should not update fields that do not match check_values', async () => {
        const harness = await makeTest(valueCheckOpConfig);
        const results = await harness.runSlice(testData2);

        expect(results[0].test_prop).toBe('value');
        expect(results[1].test_prop).toBe(10);
        expect(results[2].test_prop).toBe(100);
    });

    it('can add fields when the conditional is met', async () => {
        const harness = await makeTest({
            check_name: 'count',
            check_values: [null],
            set_name: 'count',
            set_value: 0,
            create_check_field: true
        });

        const myTestData = [
            {
                id: 1,
                count: 1
            },
            {
                id: 2,
                count: 10
            },
            {
                id: 3,
            }
        ];
        const results = await harness.runSlice(myTestData);

        expect(results[0].count).toBe(1);
        expect(results[1].count).toBe(10);
        expect(results[2].count).toBe(0);
    })
});
