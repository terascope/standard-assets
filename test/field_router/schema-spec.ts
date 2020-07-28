import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { FieldRouterConfig } from '../../asset/src/field_router/interfaces';

describe('Field Router Schema', () => {
    let harness: WorkerTestHarness;
    const name = 'field_router';

    async function makeSchema(config: AnyObject = {}): Promise<FieldRouterConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return accumConfig as FieldRouterConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should throw an error if no fields specified', async () => {
            await expect(makeSchema({})).toReject();
        });

        it('should throw an error if `fields` is not an array', async () => {
            await expect(makeSchema({ fields: null })).toReject();
            await expect(makeSchema({ fields: undefined })).toReject();
            await expect(makeSchema({ fields: JSON.stringify('this ia a string') })).toReject();
            await expect(makeSchema({ fields: 42 })).toReject();
        });
    });
});
