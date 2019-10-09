
import opTestHarness from '@terascope/teraslice-op-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import path from 'path';
import { Processor, Schema } from '../asset/src/post_process';

describe('extraction phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: opTestHarness.TestHarness;
    const type = 'processor';
    const assetName = 'someAssetId';

    beforeEach(() => {
        opTest = opTestHarness({ Processor, Schema });
        opTest.context.sysconfig.teraslice.assets_directory = testAssetPath;
    });

    it('can run and post_process data', async () => {
        const opConfig = {
            _op: 'transform',
            rules: [`${assetName}:transformRules.txt`],
            plugins: ['someAssetId:plugins']
        };

        const executionConfig = newTestExecutionConfig({
            assets: [assetName],
            operations: [opConfig]
        });

        const data = [
            new DataEntity({ interm1: 'hello', interm2: 'world' }, { selectors: ['some:data'] }),
            new DataEntity({ id: '1' }, { selectors: ['*'] }),
            new DataEntity({}, { selectors: ['date:[2019-04-16T20:14:44.304Z TO *] AND bytes:>=1000000'] }),
        ];

        const test = await opTest.init({ executionConfig, type });
        const results = await test.run(data);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual({ interm1: 'hello', interm2: 'world', final: 'hello world' });
        expect(results[1]).toEqual({ id: 1 });
        expect(results[2]).toEqual({ wasTagged: true });
    });
});
