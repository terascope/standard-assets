import 'jest-extended';
import { DataEntity, OpConfig } from '@terascope/job-components';
import Processor from '../asset/src/sort/processor';
import Schema from '../asset/src/sort/schema';
import DataWindow from '../asset/src/helpers/data-window';
import { makeTest } from './helpers';

const testData = [
    {
        id: 1
    },
    {
        id: 3
    },
    {
        id: 2
    }
];

describe('sort should', () => {
    const testHarness = makeTest(Processor, Schema);

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sort',
                field: 'id'
            },
            type: 'processor'
        });
    });

    afterAll(() => testHarness.shutdown());

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('sort input correctly', async () => {
        const results = await testHarness.run(testData) as any[];
        expect(results).toBeArrayOfSize(3);

        let next = 1;
        for (const doc of results) {
            expect(doc.id).toBe(next);
            next += 1;
        }
    });
});

describe('sort (with field) should', () => {
    const testHarness = makeTest(Processor, Schema);
    let opConfig: OpConfig;

    beforeEach(async () => {
        opConfig = {
            _op: 'sort',
            field: 'id'
        };
    });

    afterEach(() => testHarness.shutdown());

    // array of 3 windows, 10 unordered items in each window
    const dataWindows: DataWindow[] = [];
    for (let i = 0; i < 3; i++) {
        // @ts-ignore
        const dataArray = Array(10).fill().map(() => {
            const obj = { id: Math.floor(Math.random() * 1000) };
            return obj;
        });
        dataWindows.push(DataWindow.make(i, dataArray));
    }

    it('sort array of data windows correctly in ascending order', async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
        const results = await testHarness.run(dataWindows) as DataWindow[];

        // all items should be returned
        expect(results).toBeArrayOfSize(3);

        // all items should be in asc order, can be equal to
        results.forEach((window) => {
            window.asArray().slice(1).forEach((item: any, i: number) => {
                expect(item.id >= window.get(i).id).toBe(true);
            });
        });
    });

    it('sort array of data windows correctly in descending order', async () => {
        opConfig.order = 'desc';
        await testHarness.initialize({ opConfig, type: 'processor' });
        const results = await testHarness.run(dataWindows) as DataWindow[];

        // all items should be returned
        expect(results).toBeArrayOfSize(3);

        // all items should be in asc order, can be equal to
        results.forEach((window) => {
            window.asArray().slice(1).forEach((item: any, i: number) => {
                expect(item.id <= window.get(i).id).toBe(true);
            });
        });
    });

    it('should not treat data entities like data windows', async () => {
        await testHarness.initialize({ opConfig, type: 'processor' });
        const dataEntities = DataEntity.makeArray(testData);
        const results = await testHarness.run(dataEntities);
        expect(results).toBeArrayOfSize(3);

        let next = 1;
        results.forEach((doc: any) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });
});

describe('sort (with date field) should', () => {
    const testHarness = makeTest(Processor, Schema);
    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sort',
                field: 'date'
            },
            type: 'processor'
        });
    });

    afterAll(() => testHarness.shutdown());

    const dateData = [
        {
            id: 3,
            date: '2019-05-03T20:02:00.000Z'
        },
        {
            id: 1,
            date: '2019-05-03T20:01:00.000Z'
        },
        {
            id: 2,
            date: '2019-05-03T20:01:00.000Z'
        },
        {
            id: 4,
            date: '2019-05-03T20:03:00.000Z'
        }
    ];

    it('sort dates correctly', async () => {
        const dataEntities = DataEntity.makeArray(dateData);
        const results = await testHarness.run(dataEntities);

        expect(results).toBeArrayOfSize(4);

        let next = 1;
        results.forEach((doc: any) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });
});
