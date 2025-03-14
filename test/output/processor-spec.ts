import path from 'node:path';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { DataEntity, AnyObject } from '@terascope/job-components';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Output Phase', () => {
    const testAssetPath = path.join(dirname, '../fixtures/someAssetId');
    const opPathName = path.join(dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];

    let harness: WorkerTestHarness;

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'output',
            plugins: ['someAssetId:plugins'],
            rules: ['someAssetId:transformRules.txt']
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

    it('can run and validate data', async () => {
        const data = [
            new DataEntity({ interm1: 'hello', interm2: 'world', final: 'hello world' }),
            new DataEntity({ lastField: 'someValue' }),
        ];
        const test = await makeTest();
        const results = await test.runSlice(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ final: 'hello world' });
    });
});
