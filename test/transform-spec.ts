
import opTestHarness from '@terascope/teraslice-op-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import path from 'path';
import { Processor, Schema } from '../asset/src/transform';

describe('can transform matches', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: opTestHarness.TestHarness;
    const type = 'processor';

    beforeEach(() => {
        opTest = opTestHarness({ Processor, Schema });
        opTest.context.sysconfig.teraslice.assets_directory = testAssetPath;
    });

    it('can uses typeConifg', async () => {
        const date = new Date().toISOString();
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

        const data = DataEntity.makeArray([
            {
                some: 'data', field: 'hello', field2: 'world', _id: '1'
            },
            { location: '33.435967,  -111.867710', _id: '2' },
            { date, bytes: '1200000', _id: '3' },
            { other: 'stuff', _id: '4' }
        ]);

        const test = await opTest.init({ executionConfig, type });
        const results = await test.run(data);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual({ final: 'hello world', id: 1 });
        expect(results[1]).toEqual({ loc: '33.435967,  -111.867710', id: 2 });
        expect(results[2]).toEqual({ last_seen: date, id: 3, wasTagged: true });
    });
});
