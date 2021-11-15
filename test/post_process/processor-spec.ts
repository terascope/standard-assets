import 'jest-extended';
import path from 'path';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { DataEntity, AnyObject } from '@terascope/job-components';

jest.setTimeout(10_000);

describe('post_process phase', () => {
    const testAssetPath = path.join(__dirname, '../fixtures/someAssetId');
    const opPathName = path.join(__dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];

    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'post_process',
            plugins: ['someAssetId:plugins'],
            rules: ['someAssetId:transformRules.txt'],
            types: { date: 'date', location: 'geo-point' },
            variables: {
                foo: 'data'
            }
        };
        const opConfig = Object.assign({}, _op, config);

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

    it('can run and post_process data', async () => {
        const data = [
            new DataEntity({ interm1: 'hello', interm2: 'world' }, { selectors: ['some: $foo'] }),
            new DataEntity({ id: '1' }, { selectors: ['*'] }),
            new DataEntity({}, { selectors: ['date:[2019-04-16T20:14:44.304Z TO *] AND bytes:>=1000000'] }),
        ];
        const test = await makeTest();
        const results = await test.runSlice(data);

        expect(results).toBeArrayOfSize(3);
        expect(results[0]).toEqual({ interm1: 'hello', interm2: 'world', final: 'hello world' });
        expect(results[1]).toEqual({ id: 1 });
        expect(results[2]).toEqual({ wasTagged: true });
    });
});
