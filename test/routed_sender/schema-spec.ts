import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { RouteSenderConfig } from '../../asset/src/routed_sender/interfaces.js';
// This is a temp fix to get routed sender imported during testing. May not be a good idea
await import('../../asset/src/routed_sender/processor.js');
//

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('routed_sender Schema', () => {
    let harness: WorkerTestHarness;
    const testAssetPath = path.join(dirname, '../fixtures/someAssetId');
    const opPathName = path.join(dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];
    const name = 'routed_sender';
    const _api_name = 'test_api';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<RouteSenderConfig> {
        const opConfig: OpConfig = Object.assign({
            _op: name,
            _api_name
        }, config);
        const job = newTestJobConfig({
            max_retries: 0,
            apis: [
                {
                    _name: _api_name,
                    some: 'config'
                },
            ],
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                {
                    _op: 'key_router',
                    use: 1,
                    from: 'beginning'
                },
                opConfig
            ],
        });

        harness = new WorkerTestHarness(job, { assetDir });
        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig: any) => testConfig._op === name
        );

        return validConfig as RouteSenderConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should expect to be properly configured', async () => {
            const routing = { a: 'default' };

            await expect(makeSchema({})).toReject();
            await expect(makeSchema({ size: 'test', _api_name, routing })).toReject();
            await expect(makeSchema({ size: [12341234], _api_name, routing })).toReject();
            await expect(makeSchema({ size: -12341234, _api_name, routing })).toReject();
            await expect(makeSchema({ routing: -12341234, _api_name })).toReject();

            await expect(makeSchema({ routing: 'hello', _api_name })).toReject();
            await expect(makeSchema({ routing: {}, _api_name })).toReject();
            await expect(makeSchema({ routing: { b: undefined }, _api_name })).toReject();

            await expect(makeSchema({ _api_name, concurrency: -2134, routing })).toReject();
            await expect(makeSchema({ _api_name, concurrency: 'hello', routing })).toReject();

            await expect(makeSchema({
                _api_name,
                concurrency: 10,
                routing,
                size: 3000
            })).toResolve();
        });

        it('should throw if routing has both * and **', async () => {
            await expect(makeSchema({
                _api_name,
                routing: {
                    '*': 'default',
                    '**': 'default'
                }
            })).toReject();
        });

        it('should throw if _api_name is not listed on the job', async () => {
            await expect(makeSchema({
                _api_name: 'hello',
                routing: {
                    '*': 'default',
                }
            })).toReject();
        });
    });
});
