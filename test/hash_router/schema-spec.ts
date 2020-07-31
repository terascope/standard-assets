import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { HashRouterConfig } from '../../asset/src/hash_router/interfaces';

describe('Hash partitioner Schema', () => {
    let harness: WorkerTestHarness;
    const name = 'hash_router';

    async function makeSchema(config: AnyObject = {}): Promise<HashRouterConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as HashRouterConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should throw an error if `fields` is not an array of strings', async () => {
            await expect(makeSchema({ fields: null, buckets: 1 })).toReject();
            await expect(makeSchema({ fields: undefined, buckets: 1 })).toReject();
            await expect(makeSchema({ fields: JSON.stringify('this ia a string'), buckets: 1 })).toReject();
            await expect(makeSchema({ fields: 42, buckets: 1 })).toReject();
            await expect(makeSchema({ fields: [42], buckets: 1 })).toReject();

            await expect(makeSchema({ fields: [], buckets: 1 })).toResolve();
            await expect(makeSchema({ fields: ['someField'], buckets: 1 })).toResolve();
        });

        it('should throw an error if `buckets` is not a positive number', async () => {
            await expect(makeSchema({ fields: null })).toReject();
            await expect(makeSchema({ fields: undefined })).toReject();
            await expect(makeSchema({ fields: JSON.stringify('this ia a string') })).toReject();
            await expect(makeSchema({ fields: -42 })).toReject();
            await expect(makeSchema({ fields: [] })).toReject();
            await expect(makeSchema({ fields: [42] })).toReject();
        });
    });
});
