import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';
import { KeyRouterConfig } from '@terascope/standard-asset-apis';

describe('Key Router Schema', () => {
    let harness: WorkerTestHarness;
    const name = 'key_router';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<KeyRouterConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as KeyRouterConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should throw if use and count are not used together', async () => {
            await expect(makeSchema({ use: 4 })).toReject();
        });

        it('should values are incorrect', async () => {
            await expect(makeSchema({ use: 'hello', from: 4 })).toReject();
            await expect(makeSchema({ use: 3, from: 'hello' })).toReject();
            await expect(makeSchema({ case: 4 })).toReject();
            await expect(makeSchema({ case: 'other' })).toReject();
        });
    });
});
