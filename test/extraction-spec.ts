import path from 'path';
import { OpTestHarness } from 'teraslice-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import { Processor, Schema } from '../asset/src/extraction';
import { makeTest } from './helpers';

describe('extraction phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: OpTestHarness;
    const type = 'processor';
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

    beforeAll(() => {
        opTest = makeTest(Processor, Schema);
        opTest.harness.context.sysconfig.teraslice.assets_directory = testAssetPath;
        return opTest.initialize({ executionConfig, type });
    });

    afterAll(() => opTest.shutdown());

    it('can run and extract data', async () => {
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

        const results = await opTest.run(dataArray);

        expect(results.length).toEqual(2);

        results.forEach((result: any, ind: number) => {
            expect(result).toEqual(resultsArray[ind]);
            expect(result.getMetadata('selectors')).toEqual(metaArray[ind].selectors);
        });
    });
});
