import path from 'path';
import { OpTestHarness } from 'teraslice-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import { Processor, Schema } from '../../asset/src/output';
import { makeTest } from '../helpers';

describe('output phase', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: OpTestHarness;
    const type = 'processor';

    const opConfig = {
        _op: 'transform',
        plugins: ['someAssetId:plugins'],
        rules: ['someAssetId:transformRules.txt']
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

    it('can run and validate data', async () => {
        const data = [
            new DataEntity({ interm1: 'hello', interm2: 'world', final: 'hello world' }),
            new DataEntity({ lastField: 'someValue' }),
        ];

        const results = await opTest.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ final: 'hello world' });
    });
});
