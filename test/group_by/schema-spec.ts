import 'jest-extended';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { GroupByConfig } from '../../asset/src/group_by/interfaces.js';

describe('group_by schema', () => {
    let harness: WorkerTestHarness;
    const name = 'group_by';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<GroupByConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as GroupByConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ field: 'test' })).toResolve();
        await expect(makeSchema({ field: [12341234] })).toReject();
        await expect(makeSchema({ field: 12341234 })).toReject();
    });
});
