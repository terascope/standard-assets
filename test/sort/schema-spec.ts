import 'jest-extended';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { SortConfig } from '../../asset/src/sort/interfaces.js';

describe('sort schema', () => {
    let harness: WorkerTestHarness;
    const name = 'sort';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<SortConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as SortConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({ field: { some: 'stuff' } })).toReject();
        await expect(makeSchema({ field: 12341234 })).toReject();
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ field: 'someField', order: 123 })).toReject();
        await expect(makeSchema({ field: 'someField', order: 'hello' })).toReject();
        await expect(makeSchema({ field: 'someField', order: null })).toReject();

        await expect(makeSchema({ field: 'someField' })).toResolve();
        await expect(makeSchema({ field: 'someField', order: 'desc' })).toResolve();
    });
});
