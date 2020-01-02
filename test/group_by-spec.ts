import 'jest-extended';
import { DataEntity } from '@terascope/job-components';
import Processor from '../asset/src/group_by/processor';
import Schema from '../asset/src/group_by/schema';
import DataWindow from '../asset/src/helpers/data-window';
import { makeTest } from './helpers';

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

describe('group_by (with field) should', () => {
    const opConfig = {
        _op: 'group_by',
        field: 'id'
    };
    const testHarness = makeTest(Processor, Schema);

    beforeAll(async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
    });
    afterAll(() => testHarness.shutdown());

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('group by id field if input data is an array of objects', async () => {
        const results = await testHarness.run(testData) as DataWindow[];
        expect(results).toBeArrayOfSize(3);
        expect(results[0].asArray()).toBeArrayOfSize(1);
        expect(results[0].getMetadata('_key')).toBe(1);

        expect(results[1].asArray()).toBeArrayOfSize(3);
        expect(results[1].getMetadata('_key')).toBe(2);

        expect(results[2].asArray()).toBeArrayOfSize(2);
        expect(results[2].getMetadata('_key')).toBe(3);
    });

    it('group by id field if input data is an array of data windows', async () => {
        const dw1 = DataWindow.make(undefined, testData);

        // 3 -id:2 , 1 - id:3
        const dw2 = DataWindow.make(undefined, testData.slice(1, 4));

        // 1 - id: 3
        const dw3 = DataWindow.make(undefined, testData.slice(5,));

        const results = await testHarness.run([dw1, dw2, dw3]) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        expect(results[0].asArray()).toBeArrayOfSize(1);
        expect(results[0].getMetadata('_key')).toBe(1);

        expect(results[1].asArray()).toBeArrayOfSize(6);
        expect(results[1].getMetadata('_key')).toBe(2);

        expect(results[2].asArray()).toBeArrayOfSize(3);
        expect(results[2].getMetadata('_key')).toBe(3);
    });
});

describe('group_by should', () => {
    const opConfig = {
        _op: 'group_by'
    };
    const testHarness = makeTest(Processor, Schema);

    beforeAll(async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
    });

    it('should group by metadata key if no field name is given', async () => {
        const keyedTestData = [{ id: 1 }, { id: 2 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 3 }]
            .map((doc) => DataEntity.make(doc, { _key: doc.id }));

        const results = await testHarness.run(keyedTestData) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        expect(results[0].getMetadata('_key')).toBe(1);
        expect(results[0].asArray()).toBeArrayOfSize(1);

        expect(results[1].getMetadata('_key')).toBe(2);
        expect(results[1].asArray()).toBeArrayOfSize(3);

        expect(results[2].getMetadata('_key')).toBe(3);
        expect(results[2].asArray()).toBeArrayOfSize(2);
    });
});
