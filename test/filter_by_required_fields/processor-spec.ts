import { DataEntity } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { FilterByRequiredFieldConfig, LogicType } from '../../asset/src/filter_by_required_fields/interfaces.js';

describe('filter_by_required_fields', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<FilterByRequiredFieldConfig> = {}) {
        const baseConfig = {
            _op: 'filter_by_required_fields',
            required_fields: ['age', 'name', 'size']
        };

        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }


    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should return empty array from empty values', async () => {
        const harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('should return only docs with all legit values', async () => {
        const data = [
            {
                age: 20,
                name: 'bob1',
                size: 10
            },
            {
                name: 'bob2',
                size: 11
            },
            {
                age: 21,
                size: 12
            },
            {
                age: 22,
                name: 'bob3',
            },
            {
                goop: true
            },
            {
                age: undefined,
                name: 'bob4',
                size: 13
            },
            {
                age: 23,
                name: 'NA',
                size: 14
            },
            {
                age: 24,
                name: 'bob5',
                size: ''
            },
            {
                age: 25,
                name: 'bob6',
                size: null
            },
            {
                age: 26,
                name: 'bob7',
                size: 15
            }
        ];

        const harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toBe(2);
        expect(results[0].name).toBe('bob1');
        expect(results[0].age).toBe(20);
        expect(results[0].size).toBe(10);
        expect(results[1].name).toBe('bob7');
        expect(results[1].age).toBe(26);
        expect(results[1].size).toBe(15);
    });

    it('can work with OR statements', async () => {
        const data = [
            {
                age: 20,
                name: 'bob1',
                size: 10
            },
            {
                name: 'bob2',
            },
            {
                age: 21,
                size: 12
            },
            {
                age: 22,
                name: 'bob3',
            },
            {
                goop: true,
                name: 'bob',
                date: 'sometime'
            },
            {
                age: 25,
                name: 'bob6',
                size: null
            },
            {
                age: null,
                name: 'bob7',
                size: null
            }
        ];

        const harness = await makeTest({
            required_fields: ['age', 'size'],
            filter_type: LogicType.OR
        });
        const results = await harness.runSlice(data);

        expect(results.length).toBe(4);
    });

    it('can invert the data', async () => {
        const harness = await makeTest({
            required_fields: ['age', 'size'],
            filter_type: LogicType.OR,
            invert: true
        });

        const data = [
            {
                age: 20,
                name: 'bob1',
                size: 10
            },
            {
                name: 'bob2',
            },
            {
                age: 21,
                size: 12
            },
            {
                age: 22,
                name: 'bob3',
            },
            {
                goop: true,
                name: 'bob',
                date: 'sometime'
            },
            {
                age: 25,
                name: 'bob6',
                size: null
            },
            {
                age: null,
                name: 'bob7',
                size: null
            }
        ];

        const results = await harness.runSlice(data);

        expect(results.length).toBe(3);
        expect(results).toEqual([
            DataEntity.make({ name: 'bob2' }),
            DataEntity.make({ goop: true, name: 'bob', date: 'sometime' }),
            DataEntity.make({ age: null, name: 'bob7', size: null })
        ]);
    });
});
