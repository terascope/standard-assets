import 'jest-extended';
import path from 'path';
import { OpTestHarness } from 'teraslice-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import { Processor, Schema } from '../asset/src/selection';
import { makeTest } from './helpers';

describe('selection phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: OpTestHarness;
    const type = 'processor';
    const assetName = 'someAssetId';
    const opConfig = {
        _op: 'transform',
        rules: [`${assetName}:transformRules.txt`],
        plugins: ['someAssetId:plugins'],
        type_config: { location: 'geo-point' },
        variables: {
            foo: 'data'
        }
    };

    const executionConfig = newTestExecutionConfig({
        assets: [assetName],
        operations: [opConfig]
    });

    beforeAll(() => {
        opTest = makeTest(Processor, Schema);
        opTest.harness.context.sysconfig.teraslice.assets_directory = testAssetPath;
        return opTest.initialize({ executionConfig, type });
    });

    afterAll(() => opTest.shutdown());

    it('can run and select data', async () => {
        const data = DataEntity.makeArray([
            { some: 'data', isTall: true },
            { some: 'thing else', person: {} },
            { hostname: 'www.example.com', bytes: 1000 },
            { location: '33.435967,-111.867710', zip: 94302 },
            {}
        ]);

        const results = await opTest.run(data);
        // because of the * selector
        expect(results).toBeArrayOfSize(5);
    });
});
