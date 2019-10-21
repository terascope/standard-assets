import 'jest-extended';
import path from 'path';
import { OpTestHarness } from 'teraslice-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import { Processor, Schema } from '../asset/src/post_process';
import { makeTest } from './helpers';

describe('extraction phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: OpTestHarness;
    const type = 'processor';
    const assetName = 'someAssetId';
    const opConfig = {
        _op: 'transform',
        rules: [`${assetName}:transformRules.txt`],
        plugins: ['someAssetId:plugins']
    };

    const executionConfig = newTestExecutionConfig({
        assets: [assetName],
        operations: [opConfig]
    });

    beforeEach(() => {
        opTest = makeTest(Processor, Schema);
        opTest.harness.context.sysconfig.teraslice.assets_directory = testAssetPath;
        return opTest.initialize({ executionConfig, type });
    });

    afterEach(() => opTest.shutdown());

    it('can run and post_process data', async () => {
        const data = [
            new DataEntity({ interm1: 'hello', interm2: 'world' }, { selectors: ['some:data'] }),
            new DataEntity({ id: '1' }, { selectors: ['*'] }),
            new DataEntity({}, { selectors: ['date:[2019-04-16T20:14:44.304Z TO *] AND bytes:>=1000000'] }),
        ];

        const results = await opTest.run(data);

        expect(results).toBeArrayOfSize(3);
        expect(results[0]).toEqual({ interm1: 'hello', interm2: 'world', final: 'hello world' });
        expect(results[1]).toEqual({ id: 1 });
        expect(results[2]).toEqual({ wasTagged: true });
    });
});
