import 'jest-extended';
import { DataEntity, times } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

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

const dataWindows: DataWindow[] = [];
for (let i = 0; i < 3; i++) {
    const dataArray = times(10, () => {
        const obj = { id: Math.floor(Math.random() * 1000) };
        return obj;
    });

    dataWindows.push(DataWindow.make(i, dataArray));
}

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

describe('sort', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'sort',
            field: 'id'
        };
        const opConfig: OpConfig = config ? Object.assign({}, _op, config) : _op;
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

    it('should sort input correctly', async () => {
        const test = await makeTest();
        const results = await test.runSlice(testData) as any[];

        expect(results).toBeArrayOfSize(3);

        let next = 1;
        for (const doc of results) {
            expect(doc.id).toBe(next);
            next += 1;
        }
    });

    it('should sort array of data windows correctly in ascending order', async () => {
        const test = await makeTest();
        const results = await test.runSlice(dataWindows) as DataWindow[];
        // all items should be returned
        expect(results).toBeArrayOfSize(3);

        // all items should be in asc order, can be equal to
        results.forEach((window) => {
            window.asArray().slice(1)
                .forEach((item: any, i: number) => {
                    expect(item.id >= window.get(i).id).toBe(true);
                });
        });
    });

    it('sort array of data windows correctly in descending order', async () => {
        const test = await makeTest({ order: 'desc' });
        const results = await test.runSlice(dataWindows) as DataWindow[];

        // all items should be returned
        expect(results).toBeArrayOfSize(3);

        // all items should be in asc order, can be equal to
        results.forEach((window) => {
            window.asArray().slice(1)
                .forEach((item: any, i: number) => {
                    expect(item.id <= window.get(i).id).toBe(true);
                });
        });
    });

    it('should not treat data entities like data windows', async () => {
        const test = await makeTest();
        const dataEntities = DataEntity.makeArray(testData);
        const results = await test.runSlice(dataEntities);

        expect(results).toBeArrayOfSize(3);

        let next = 1;
        results.forEach((doc: any) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });

    it('should sort dates correctly', async () => {
        const test = await makeTest({ field: 'date' });

        const dataEntities = DataEntity.makeArray(dateData);
        const results = await test.runSlice(dataEntities);

        expect(results).toBeArrayOfSize(4);

        let next = 1;
        results.forEach((doc: any) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });
});
