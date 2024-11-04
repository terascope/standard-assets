import { WorkerTestHarness } from 'teraslice-test-harness';

describe('remove_empty_fields should', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config = {}) {
        const baseConfig = {
            _op: 'remove_empty_fields',
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    const testData = [
        {
            id: 1,
            name: 'joe',
            age: 102.875
        },
        {
            id: 2,
            name: '',
            age: 23,
            happy: true,
            field: [],
            field2: {},
            field3: undefined,
            field4: null,
            field5: 'UNDEFINED'
        },
        {
            id: 3,
            name: 'bob',
            age: '',
            happy: false,
            field7: ['thing1', 'thing2'],
            field8: { foo: 'bar' }
        },
        {
            id: 4,
            name: '         ',
            age: '',
            size: ''
        }
    ];

    it('generate an empty result if no input data', async () => {
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('remove empty fields from records', async () => {
        harness = await makeTest();
        const results = await harness.runSlice(testData);

        expect(results.length).toBe(4);

        expect(results[0]).toEqual({
            id: 1, name: 'joe', age: 102.875
        });

        expect(results[1]).toEqual({
            id: 2,
            age: 23,
            happy: true,
            field5: 'UNDEFINED'
        });

        expect(results[2]).toEqual({
            id: 3,
            name: 'bob',
            happy: false,
            field7: ['thing1', 'thing2'],
            field8: { foo: 'bar' }
        });

        expect(results[3]).toEqual({
            id: 4
        });
    });
});
