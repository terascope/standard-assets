import { cloneDeep } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { FilterByUnknownFieldsConfig } from '../../asset/src/filter_by_unknown_fields/interfaces.js';

const data = [
    {
        name: 'joe',
        age: 32,
        height: 100
    },
    {
        name: 'mel',
        age: 20,
        height: 200
    },
    {
        name: 'tim',
        age: 33,
        height: 150,
        weight: 2022
    },
    {
        name: 'red',
        age: 38,
        height: 120
    },
    {
        name: 'frey',
        age: 48,
        height: 125
    }
];

describe('filter_by_unknown_fields', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<FilterByUnknownFieldsConfig> = {}) {
        const baseConfig = {
            _op: 'filter_by_unknown_fields',
            known_fields: ['name', 'age', 'height']
        };

        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should return an empty array from an empty array', async () => {
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toEqual(0);
    });

    it('should return only records that have known fields', async () => {
        harness = await makeTest();
        const results = await harness.runSlice(cloneDeep(data));

        expect(results).toEqual(
            [
                {
                    name: 'joe',
                    age: 32,
                    height: 100
                },
                {
                    name: 'mel',
                    age: 20,
                    height: 200
                },
                {
                    name: 'red',
                    age: 38,
                    height: 120
                },
                {
                    name: 'frey',
                    age: 48,
                    height: 125
                }
            ]
        );
    });

    it('should return only records that have unknown fields if invert is true', async () => {
        harness = await makeTest({ invert: true });
        const results = await harness.runSlice(cloneDeep(data));

        expect(results).toEqual([
            {
                name: 'tim',
                age: 33,
                height: 150,
                weight: 2022
            }
        ]);
    });
});
