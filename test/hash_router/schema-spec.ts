import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/types';
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
            await expect(makeSchema({ fields: null as any, partitions: 1 })).toResolve();
            await expect(makeSchema({ fields: undefined, partitions: 1 })).toResolve();
            await expect(makeSchema({ fields: JSON.stringify('this ia a string') as any, partitions: 1 })).toReject();
            await expect(makeSchema({ fields: 42 as any, partitions: 1 })).toReject();
            await expect(makeSchema({ fields: [42] as any, partitions: 1 })).toReject();

            await expect(makeSchema({ fields: [], partitions: 1 })).toResolve();
            await expect(makeSchema({ fields: ['someField'], partitions: 1 })).toResolve();
        });

        it('should throw an error if `partitions` is not a positive number', async () => {
            await expect(makeSchema({ fields: ['someField'], partitions: null as any })).toReject();
            await expect(makeSchema({ fields: ['someField'], partitions: undefined })).toReject();
            await expect(makeSchema({ fields: ['someField'], partitions: JSON.stringify('this ia a string') as any })).toReject();
            await expect(makeSchema({ fields: ['someField'], partitions: -42 as any })).toReject();
            await expect(makeSchema({ fields: ['someField'], partitions: [] as any })).toReject();
            await expect(makeSchema({ fields: ['someField'], partitions: [42 as any] as any })).toReject();
        });
    });
});
