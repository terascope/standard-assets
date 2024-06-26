import 'jest-extended';
import { DataEntity, AnyObject } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

const testData = [
    {
        id: 1
    },
    {
        id: 2
    },
    {
        id: 2
    },
    {
        id: 2
    },
    {
        id: 3
    },
    {
        id: 3
    }
];

describe('group_by', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'group_by',
            field: 'id'
        };
        const opConfig = config ? Object.assign({}, _op, config) : _op;
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

    it('should group by id field if input data is an array of objects', async () => {
        const test = await makeTest();
        const results = await test.runSlice(testData);

        expect(results).toBeArrayOfSize(3);
        expect(results[0].asArray()).toBeArrayOfSize(1);
        expect(results[0].getMetadata('_key')).toBe(1);

        expect(results[1].asArray()).toBeArrayOfSize(3);
        expect(results[1].getMetadata('_key')).toBe(2);

        expect(results[2].asArray()).toBeArrayOfSize(2);
        expect(results[2].getMetadata('_key')).toBe(3);
    });

    it('should group by id field if input data is an array of data windows', async () => {
        const dw1 = DataWindow.make(undefined, testData);

        // 3 -id:2 , 1 - id:3
        const dw2 = DataWindow.make(undefined, testData.slice(1, 4));

        // 1 - id: 3
        const dw3 = DataWindow.make(undefined, testData.slice(5,));

        const test = await makeTest();
        const results = await test.runSlice([dw1, dw2, dw3]) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        expect(results[0].asArray()).toBeArrayOfSize(1);
        expect(results[0].getMetadata('_key')).toBe(1);

        expect(results[1].asArray()).toBeArrayOfSize(6);
        expect(results[1].getMetadata('_key')).toBe(2);

        expect(results[2].asArray()).toBeArrayOfSize(3);
        expect(results[2].getMetadata('_key')).toBe(3);
    });

    it('should group by metadata key if no field name is given', async () => {
        const keyedTestData = [{ id: 1 }, { id: 2 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 3 }]
            .map((doc) => DataEntity.make(doc, { _key: doc.id }));

        const test = await makeTest({ field: undefined });

        const results = await test.runSlice(keyedTestData) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        expect(results[0].getMetadata('_key')).toBe(1);
        expect(results[0].asArray()).toBeArrayOfSize(1);

        expect(results[1].getMetadata('_key')).toBe(2);
        expect(results[1].asArray()).toBeArrayOfSize(3);

        expect(results[2].getMetadata('_key')).toBe(3);
        expect(results[2].asArray()).toBeArrayOfSize(2);
    });
});
