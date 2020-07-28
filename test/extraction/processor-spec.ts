import { WorkerTestHarness } from 'teraslice-test-harness';
import { DataEntity, AnyObject } from '@terascope/job-components';

describe('extraction phase', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'transform',
            plugins: ['someAssetId:plugins'],
            rules: ['someAssetId:transformRules.txt'],
            types: { date: 'date', location: 'geo-point' },
            variables: {
                foo: 'data'
            }
        };

        const opConfig = Object.assign({}, _op, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

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
            // eslint-disable-next-line no-useless-escape
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
