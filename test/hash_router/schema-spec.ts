import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';
import { HashRouterConfig } from '@terascope/standard-asset-apis';

describe('Hash Router Schema', () => {
    let harness: WorkerTestHarness;
    const name = 'hash_router';

    async function makeSchema(
        config: Partial<HashRouterConfig> = {}
    ): Promise<HashRouterConfig & OpConfig> {
        const opConfig = Object.assign({}, { _op: name }, config as HashRouterConfig);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as HashRouterConfig & OpConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should throw an error if `fields` is not an array of strings or null/undefined', async () => {
            await expect(makeSchema({ fields: null as any, buckets: 1 })).toResolve();
            await expect(makeSchema({ fields: undefined, buckets: 1 })).toResolve();
            await expect(makeSchema({ fields: JSON.stringify('this ia a string') as any, buckets: 1 })).toReject();
            await expect(makeSchema({ fields: 42 as any, buckets: 1 })).toReject();
            await expect(makeSchema({ fields: [42] as any, buckets: 1 })).toReject();

            await expect(makeSchema({ fields: [], buckets: 1 })).toResolve();
            await expect(makeSchema({ fields: ['someField'], buckets: 1 })).toResolve();
        });

        it('should throw an error if `buckets` is not a positive number', async () => {
            await expect(makeSchema({ fields: null as any })).toReject();
            await expect(makeSchema({ fields: undefined })).toReject();
            await expect(makeSchema({ fields: JSON.stringify('this ia a string') as any })).toReject();
            await expect(makeSchema({ fields: -42 as any })).toReject();
            await expect(makeSchema({ fields: [] })).toReject();
            await expect(makeSchema({ fields: [42 as any] })).toReject();
        });
    });
});
