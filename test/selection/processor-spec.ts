import 'jest-extended';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { DataEntity, AnyObject } from '@terascope/job-components';
import path from 'path';

jest.setTimeout(10_000);

describe('selection phase', () => {
    const testAssetPath = path.join(__dirname, '../fixtures/someAssetId');
    const opPathName = path.join(__dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];

    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'selection',
            plugins: ['someAssetId:plugins'],
            rules: ['someAssetId:transformRules.txt'],
            types: { date: 'date', location: 'geo-point' },
            variables: {
                foo: 'data'
            }
        };
        const opConfig = Object.assign({}, _op, config);

        const job = newTestJobConfig({
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                opConfig
            ]
        });

        harness = new WorkerTestHarness(job, { assetDir });
        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('can run and select data', async () => {
        const data = DataEntity.makeArray([
            { some: 'data', isTall: true },
            { some: 'thing else', person: {} },
            { hostname: 'www.example.com', bytes: 1000 },
            { location: '33.435967,-111.867710', zip: 94302 },
            {}
        ]);

        const test = await makeTest();
        const results = await test.runSlice(data);
        // because of the * selector
        expect(results).toBeArrayOfSize(5);
    });
});
