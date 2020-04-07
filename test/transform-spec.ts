import path from 'path';
import { OpTestHarness } from 'teraslice-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';
import { Processor, Schema } from '../asset/src/transform';
import { makeTest } from './helpers';

describe('transform matches', () => {
    const testAssetPath = path.join(__dirname, './assets');
    let opTest: OpTestHarness;
    const type = 'processor';
    const opConfig = {
        _op: 'transform',
        plugins: ['someAssetId:plugins'],
        rules: ['someAssetId:transformRules.txt'],
        type_config: {
            date: 'date',
            location: 'geo-point'
        },
        variables: {
            foo: 'data'
        }
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

    it('can uses type config', async () => {
        const date = new Date().toISOString();

        const data = DataEntity.makeArray([
            {
                some: 'data', field: 'hello', field2: 'world', _id: '1'
            },
            { location: '33.435967,  -111.867710', _id: '2' },
            { date, bytes: '1200000', _id: '3' },
            { other: 'stuff', _id: '4' }
        ]);

        const results = await opTest.run(data);
        console.log('results', results)
        expect(results.length).toEqual(3);
        expect(results[0]).toEqual({ final: 'hello world', id: 1 });
        expect(results[1]).toEqual({ loc: '33.435967,  -111.867710', id: 2 });
        expect(results[2]).toEqual({ last_seen: date, id: 3, wasTagged: true });
    });
});
