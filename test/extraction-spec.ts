
import opTestHarness from '@terascope/teraslice-op-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import path from 'path';
import { Processor, Schema } from '../asset/src/extraction';

describe('extraction phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: opTestHarness.TestHarness;
    const type = 'processor';

    beforeEach(() => {
        opTest = opTestHarness({ Processor, Schema });
        opTest.context.sysconfig.teraslice.assets_directory = testAssetPath;
    });

    it('can run and extract data', async () => {
        const opConfig = {
            _op: 'transform',
            plugins: ['someAssetId:plugins'],
            rules: ['someAssetId:transformRules.txt'],
            types: { date: 'date' }
        };

        const executionConfig = newTestExecutionConfig({
            assets: ['someAssetId'],
            operations: [opConfig]
        });

        const data = [
            { some: 'data', field: 'onething', field2: 'something' },
            { location: '33.242, -111.453' }
        ];

        const metaArray = [
            { selectors: ['some:data', '*'] },
            // eslint-disable-next-line no-useless-escape
            { selectors: ['location:(_geo_box_top_left_: \"33.906320,  -112.758421\" _geo_box_bottom_right_:\"32.813646,-111.058902\")', '*'] }
        ];

        const resultsArray = [
            { interm1: 'onething', interm2: 'something' },
            { loc: '33.242, -111.453' }
        ];

        const dataArray = data.map((obj, ind) => new DataEntity(obj, metaArray[ind]));

        const test = await opTest.init({ executionConfig, type });
        const results = await test.run(dataArray);

        expect(results.length).toEqual(2);

        results.forEach((result: any, ind: number) => {
            expect(result).toEqual(resultsArray[ind]);
            expect(result.getMetadata('selectors')).toEqual(metaArray[ind].selectors);
        });
    });
});
