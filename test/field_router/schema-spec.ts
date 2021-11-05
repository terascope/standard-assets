import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';
import { FieldRouterConfig } from '@terascope/standard-asset-apis';

describe('Field Router Schema', () => {
    let harness: WorkerTestHarness;
    const name = 'field_router';

    async function makeSchema(
        config: Partial<FieldRouterConfig> = {}
    ): Promise<FieldRouterConfig & OpConfig> {
        const opConfig: FieldRouterConfig & OpConfig = Object.assign(
            {}, { _op: name }, config as FieldRouterConfig
        );
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as FieldRouterConfig & OpConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should throw an error if no fields specified', async () => {
            await expect(makeSchema({})).toReject();
        });

        it('should throw an error if `fields` is not an array', async () => {
            await expect(makeSchema({ fields: null as any })).toReject();
            await expect(makeSchema({ fields: undefined as any })).toReject();
            await expect(makeSchema({ fields: JSON.stringify('this ia a string') as any })).toReject();
            await expect(makeSchema({ fields: 42 as any })).toReject();
        });
    });
});
