import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { PhaseConfig } from '../../asset/src/transform/interfaces';

describe('transform Schema', () => {
    let harness: WorkerTestHarness;
    const name = 'transform';

    async function makeSchema(config: AnyObject = {}): Promise<PhaseConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as PhaseConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should expect to be properly configured', async () => {
            await expect(makeSchema({})).toReject();
            await expect(makeSchema({ rules: 'test' })).toReject();
            await expect(makeSchema({ rules: [12341234] })).toReject();

            await expect(makeSchema({ rules: ['foo:bar'], plugins: 12341234 })).toReject();
            await expect(makeSchema({ rules: ['foo:bar'], plugins: ['asdf'] })).toReject();
        });
    });
});
