import path from 'path';
import { OpTestHarness } from 'teraslice-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import { Processor, Schema } from '../asset/src/match';
import { makeTest } from '../helpers';

describe('match phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    const type = 'processor';
    let opTest: OpTestHarness;
    const assetName = 'someAssetId';

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

    beforeAll(() => {
        opTest = makeTest(Processor, Schema);
        opTest.harness.context.sysconfig.teraslice.assets_directory = testAssetPath;
        return opTest.initialize({ executionConfig, type });
    });

    afterAll(() => opTest.shutdown());

    it('can return matching documents', async () => {
        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: '2018-12-16T15:16:09.076Z' }
        ]);

        const results = await opTest.run(data);

        expect(results.length).toEqual(3);
    });
});
