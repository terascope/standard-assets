import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('add_date schema', () => {
    let harness: WorkerTestHarness;
    const name = 'add_date';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<OpConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name }, config);
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
        await expect(makeSchema({ field: 'date' })).toResolve();
        await expect(makeSchema({ field: 'date', overwrite: true })).toResolve();
        await expect(makeSchema({ field: 1234 })).toReject();
        await expect(makeSchema({ field: true })).toReject();
        await expect(makeSchema({ field: 'date', overwrite: 'yes' })).toReject();
    });

    it('should accept every DateFormat value', async () => {
        await expect(makeSchema({ field: 'date', format: 'iso_8601' })).toResolve();
        await expect(makeSchema({ field: 'date', format: 'epoch_millis' })).toResolve();
        await expect(makeSchema({ field: 'date', format: 'epoch' })).toResolve();
        await expect(makeSchema({ field: 'date', format: 'seconds' })).toResolve();
        await expect(makeSchema({ field: 'date', format: 'milliseconds' })).toResolve();
    });

    it('should accept a date-fns format string', async () => {
        await expect(makeSchema({ field: 'date', format: 'yyyy-MM-dd' })).toResolve();
        await expect(makeSchema({ field: 'date', format: 'MM/dd/yyyy HH:mm:ss' })).toResolve();
    });

    it('should reject an invalid format', async () => {
        await expect(makeSchema({ field: 'date', format: '' })).toReject();
        await expect(makeSchema({ field: 'date', format: 1234 })).toReject();
        await expect(makeSchema({ field: 'date', format: true })).toReject();
    });

    it('should default overwrite to false and format to iso_8601', async () => {
        const config = await makeSchema({ field: 'date' });

        expect(config.overwrite).toBe(false);
        expect(config.format).toBe('iso_8601');
    });
});
