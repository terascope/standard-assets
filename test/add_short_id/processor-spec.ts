import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('add_short_id', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

    beforeEach(() => {
        data = [
            {
                id: 1,
                name: 'joe'
            },
            {
                id: 2,
                name: 'moe'
            },
            {
                id: 3,
                name: 'randy'
            }
        ];
    });

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'add_short_id',
            field: 'unique_id',
            length: 8
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

    it('should return docs with a unique id of the specified properties', async () => {
        const test = await makeTest();

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        const testUnique: { [key: string]: boolean } = {};

        results.forEach((doc) => {
            expect(DataEntity.isDataEntity(doc)).toBe(true);
            expect(doc.unique_id).toBeDefined();
            expect(doc.unique_id).toHaveLength(8);

            testUnique[doc.unique_id] = true;
        });

        expect(Object.keys(testUnique)).toHaveLength(3);
    });

    it('should return data window with unique ID added to each doc', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
            DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
        ];

        const test = await makeTest();

        const results = await test.runSlice(testWindow) as DataEntity[];

        for (const i of results) {
            i.asArray().forEach((x: any) => {
                expect(x.unique_id).toBeDefined();
                expect(x.unique_id).toHaveLength(8);
            });
        }
    });

    it('should create an id using the specified dictionary', async () => {
        const test = await makeTest({
            _op: 'add_short_id',
            field: 'unique_id',
            length: 12,
            dictionary: 'number'
        });

        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(doc.unique_id).toBeDefined();
            expect(doc.unique_id).toHaveLength(12);
            expect(doc.unique_id).toBeInteger();
        });
    });
});
