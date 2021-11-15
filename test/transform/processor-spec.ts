import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { DataEntity, AnyObject } from '@terascope/job-components';
import path from 'path';

jest.setTimeout(10_000);

describe('transform matches', () => {
    const testAssetPath = path.join(__dirname, '../fixtures/someAssetId');
    const opPathName = path.join(__dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];

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

        const job = newTestJobConfig({
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                opConfig
            ]
        });

        harness = new WorkerTestHarness(job, { assetDir });

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
                some: 'data', field: 'hello', field2: 'world', _key: '1'
            },
            { location: '33.435967,  -111.867710', _key: '2' },
            { date, bytes: '1200000', _key: '3' },
            { other: 'stuff', _key: '4' }
        ]);

        const results = await test.runSlice(data);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual({ final: 'hello world', id: 1 });
        expect(results[1]).toEqual({ loc: '33.435967,  -111.867710', id: 2 });
        expect(results[2]).toEqual({ last_seen: date, id: 3, wasTagged: true });
    });
});
