import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('filter_by_required_fields schema', () => {
    let harness: WorkerTestHarness;
    const name = 'filter_by_required_fields';

    async function makeSchema(config: Record<string, any> = {}): Promise<OpConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as OpConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ required_fields: ['someField'], filter_type: 1234 })).toReject();
        await expect(makeSchema({ required_fields: ['someField'], filter_type: 'something' })).toReject();
        await expect(makeSchema({ required_fields: ['someField'], filter_type: 'OR', invert: 1234 })).toReject();

        await expect(makeSchema({ required_fields: ['someField'] })).toResolve();
        await expect(makeSchema({ required_fields: ['someField'], filter_type: 'OR', invert: false })).toResolve();
    });
});
