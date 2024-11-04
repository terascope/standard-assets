import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { CountUniqueConfig } from '../../asset/src/count_unique/interfaces.js';

describe('count_unique', () => {
    let harness: WorkerTestHarness;

    const data = [
        {
            id: 1,
            name: 'joe'
        },
        {
            id: 2,
            type: 'string',
            name: 'joe'
        },
        {
            id: 1,
            name: 'frank'
        },
        {
            id: 3,
            name: 'frank.bob'
        },
        {
            id: 1,
            name: 'frank'
        },
        {
            id: 1,
            name: 'joe'
        },
    ];

    function convertToDE(docArray: Record<string, any>[], keyField: string) {
        return docArray.map((doc) => DataEntity.make(doc, { _key: doc[keyField] }));
    }

    async function makeTest(config: Partial<CountUniqueConfig> = {}) {
        const baseConfig = {
            _op: 'count_unique',
            preserve_fields: ['type']
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('generate an empty result if no input data', async () => {
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('verify correct counts', async () => {
        const testData = convertToDE(data, 'id');
        harness = await makeTest();

        const results = await harness.runSlice(testData);

        expect(results).toEqual([
            { count: 4, _key: 1 },
            { count: 1, _key: 2, type: 'string' },
            { count: 1, _key: 3 }
        ]);
    });

    it('preserve field if non null value', async () => {
        const test2 = [
            {
                _key: 1,
                type: 0,
            },
            {
                _key: 2,
                type: 1
            },
            {
                _key: 3,
                type: false
            }
        ];

        const testData = convertToDE(test2, '_key');
        harness = await makeTest();

        const results = await harness.runSlice(testData);

        expect(results).toEqual([
            { count: 1, _key: 1, type: 0 },
            { count: 1, _key: 2, type: 1 },
            { count: 1, _key: 3, type: false }
        ]);
    });

    it('verify correct counts when using a non-key field', async () => {
        const testData = convertToDE(data, 'id');
        harness = await makeTest({ field: 'name' });

        const results = await harness.runSlice(testData);

        expect(results).toMatchObject([
            { count: 3, _key: 'joe' },
            { count: 2, _key: 'frank' },
            { count: 1, _key: 'frank.bob' }
        ]);
    });
});
