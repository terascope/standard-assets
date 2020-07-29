import path from 'path';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DataEntity, newTestExecutionConfig } from '@terascope/job-components';

describe('transform matches', () => {
    const testAssetPath = path.join(__dirname, './assets');

    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
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
        const opConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('can uses type config', async () => {
        const test = await makeTest();
        const date = new Date().toISOString();

        const data = DataEntity.makeArray([
            {
                some: 'data', field: 'hello', field2: 'world', _id: '1'
            },
            { location: '33.435967,  -111.867710', _id: '2' },
            { date, bytes: '1200000', _id: '3' },
            { other: 'stuff', _id: '4' }
        ]);

        const results = await test.runSlice(data);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual({ final: 'hello world', id: 1 });
        expect(results[1]).toEqual({ loc: '33.435967,  -111.867710', id: 2 });
        expect(results[2]).toEqual({ last_seen: date, id: 3, wasTagged: true });
    });
});
