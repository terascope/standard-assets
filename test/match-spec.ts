
import opTestHarness from '@terascope/teraslice-op-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import path from 'path';
import { Processor, Schema } from '../asset/src/match';

describe('matcher', () => {
    const testAssetPath = path.join(__dirname, './assets');
    const type = 'processor';
    let opTest: opTestHarness.TestHarness;
    const assetName = 'someAssetId';

    beforeEach(() => {
        opTest = opTestHarness({ Processor, Schema });
        opTest.context.sysconfig.teraslice.assets_directory = testAssetPath;
    });

    it('can return matching documents', async () => {
        const opConfig = {
            _op: 'watcher',
            plugins: ['someAssetId:plugins'],
            rules: [`${assetName}:matchRules.txt`],
            types: { _created: 'date' }
        };

        const executionConfig = newTestExecutionConfig({
            assets: [assetName],
            operations: [opConfig]
        });

        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: '2018-12-16T15:16:09.076Z' }
        ]);

        const test = await opTest.init({ executionConfig, type });
        const results = await test.run(data);

        expect(results.length).toEqual(3);
    });
});
