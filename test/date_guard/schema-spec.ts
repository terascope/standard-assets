import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig, makeISODate } from '@terascope/job-components';

describe('date_guard schema', () => {
    let harness: WorkerTestHarness;
    const name = 'date_guard';

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
        await expect(makeSchema({ date_field: ['some stuff'] })).toReject();
        await expect(makeSchema({ date_field: true, limit_past: 'field' })).toReject();
        await expect(makeSchema({ date_field: 'field', limit_past: 1234 })).toReject();
        await expect(makeSchema({ date_field: 'field', limit_past: 'hello world' })).toReject();

        await expect(makeSchema({ date_field: 'someField' })).toResolve();
        await expect(makeSchema({ date_field: 'someField', limit_past: '1week' })).toResolve();
        await expect(makeSchema({ date_field: 'someField', limit_future: '1week' })).toResolve();
        await expect(makeSchema({ date_field: 'someField', limit_future: makeISODate() })).toResolve();
    });
});
