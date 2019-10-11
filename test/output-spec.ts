
import opTestHarness from '@terascope/teraslice-op-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import path from 'path';
import { Processor, Schema } from '../asset/src/output';

describe('extraction phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: opTestHarness.TestHarness;
    const type = 'processor';

    beforeEach(() => {
        opTest = opTestHarness({ Processor, Schema });
        opTest.context.sysconfig.teraslice.assets_directory = testAssetPath;
    });

    it('can run and validate data', async () => {
        const opConfig = {
            _op: 'transform',
            plugins: ['someAssetId:plugins'],
            rules: ['someAssetId:transformRules.txt']
        };

        const executionConfig = newTestExecutionConfig({
            assets: ['someAssetId'],
            operations: [opConfig]
        });

        const data = [
            new DataEntity({ interm1: 'hello', interm2: 'world', final: 'hello world' }),
            new DataEntity({ lastField: 'someValue' }),
        ];

        const test = await opTest.init({ executionConfig, type });
        const results = await test.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ final: 'hello world' });
    });
});
