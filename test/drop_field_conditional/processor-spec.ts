import 'jest-extended';
import { DataEntity, cloneDeep, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window';

describe('drop_field should', () => {
    let harness: WorkerTestHarness;
    let data: AnyObject[];

    beforeEach(() => {
        data = [
            {
                id: 1,
                name: 'joE',
                age: 29
            },
            {
                id: 2,
                name: 'mOe',
                age: 42
            },
            {
                id: 3,
                name: 'Randy',
                age: 87
            }
        ];
    });

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'drop_field_conditional',
            field: 'name'
        };

        const opConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('generate an empty result if no input data', async () => {
        const test = await makeTest({ regex: '/ting/i' });
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('drop fields that match the regex', async () => {
        const config = { regex: '/.?oe/gi' };

        const test = await makeTest(config);

        const results = await test.runSlice(cloneDeep(data));

        expect(results).toEqual([
            {
                id: 1,
                age: 29
            },
            {
                id: 2,
                age: 42
            },
            {
                id: 3,
                name: 'Randy',
                age: 87
            }
        ]);
    });

    it('drop fields that do not match the regex, if invert is true', async () => {
        const config = { regex: '/.?oe/gi', invert: true };

        const test = await makeTest(config);

        const results = await test.runSlice(cloneDeep(data));

        expect(results).toEqual([
            {
                id: 1,
                name: 'joE',
                age: 29
            },
            {
                id: 2,
                name: 'mOe',
                age: 42
            },
            {
                id: 3,
                age: 87
            }
        ]);
    });

    it('drop fields that pass validation', async () => {
        const config = {
            field: 'age',
            validation_method: 'isNumber'
        };

        const test = await makeTest(config);

        const testData = cloneDeep(data);
        testData[2].age = 'fifty';

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                id: 1,
                name: 'joE',
            },
            {
                id: 2,
                name: 'mOe',
            },
            {
                id: 3,
                name: 'Randy',
                age: 'fifty'
            }
        ]);
    });

    it('not drop fields that pass validation if invert is true', async () => {
        const config = {
            field: 'age',
            validation_method: 'isNumber',
            invert: true
        };

        const test = await makeTest(config);

        const testData = cloneDeep(data);
        testData[2].age = 'fifty';

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                id: 1,
                name: 'joE',
                age: 29
            },
            {
                id: 2,
                name: 'mOe',
                age: 42
            },
            {
                id: 3,
                name: 'Randy'
            }
        ]);
    });

    it('drop fields that pass validation with validation_args', async () => {
        const config = {
            field: 'age',
            validation_method: 'inNumberRange',
            validation_args: { min: 40, max: 45 }
        };

        const test = await makeTest(config);

        const testData = cloneDeep(data);
        testData[2].age = 50;

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                id: 1,
                name: 'joE',
                age: 29
            },
            {
                id: 2,
                name: 'mOe',
            },
            {
                id: 3,
                name: 'Randy',
                age: 50
            }
        ]);
    });

    it('drop fields that do not pass validation with validation_args, if invert is true', async () => {
        const config = {
            field: 'age',
            validation_method: 'inNumberRange',
            validation_args: { min: 40, max: 45 },
            invert: true
        };

        const test = await makeTest(config);

        const testData = cloneDeep(data);
        testData[2].age = 50;

        const results = await test.runSlice(testData);

        expect(results).toEqual([
            {
                id: 1,
                name: 'joE'
            },
            {
                id: 2,
                name: 'mOe',
                age: 42
            },
            {
                id: 3,
                name: 'Randy'
            }
        ]);
    });

    it('apply drop logic to items in data windows', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe', age: 22 }, { id: 2, name: 'moe', age: 21 }, { id: 3, name: 'randy', age: 24 }]),
            DataWindow.make('2', [{ id: 4, name: 'floe', age: 32 }, { id: 5, name: 'noe', age: 34 }, { id: 6, name: 'blandy', age: 35 }])
        ];

        const config = {
            field: 'age',
            validation_method: 'inNumberRange',
            validation_args: { min: 22, max: 33, inclusive: true }
        };

        const test = await makeTest(config);

        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        expect(results[0].asArray()[0]).toEqual({ id: 1, name: 'joe' });
        expect(results[0].asArray()[1]).toEqual({ id: 2, name: 'moe', age: 21 });
        expect(results[0].asArray()[2]).toEqual({ id: 3, name: 'randy' });
        expect(results[1].asArray()[0]).toEqual({ id: 4, name: 'floe' });
        expect(results[1].asArray()[1]).toEqual({ id: 5, name: 'noe', age: 34 });
        expect(results[1].asArray()[2]).toEqual({ id: 6, name: 'blandy', age: 35 });
    });
});
