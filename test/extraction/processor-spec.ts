import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { DataEntity, AnyObject } from '@terascope/job-components';
import path from 'path';

describe('extraction phase', () => {
    const testAssetPath = path.join(__dirname, '../fixtures/someAssetId');
    const opPathName = path.join(__dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];

    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'extraction',
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

    it('can run and extract data', async () => {
        const data = [
            { some: 'data', field: 'onething', field2: 'something' },
            { location: '33.242, -111.453' }
        ];

        const metaArray = [
            { selectors: ['some: $foo', '*'] },
            { selectors: ["location: geoBox( top_left: '33.906320, -112.758421' bottom_right: '32.813646,-111.058902')", '*'] }
        ];

        const resultsArray = [
            { interm1: 'onething', interm2: 'something' },
            { loc: '33.242, -111.453' }
        ];

        const dataArray = data.map((obj, ind) => new DataEntity(obj, metaArray[ind]));

        const test = await makeTest();
        const results = await test.runSlice(dataArray);

        expect(results.length).toEqual(2);

        results.forEach((result: any, ind: number) => {
            expect(result).toEqual(resultsArray[ind]);
            expect(result.getMetadata('selectors')).toEqual(metaArray[ind].selectors);
        });
    });
});
