import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { GroupByConfig } from '../../asset/src/group_by/interfaces';

describe('group_by schema', () => {
    let harness: WorkerTestHarness;
    const name = 'group_by';

    async function makeSchema(config: AnyObject = {}): Promise<GroupByConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return accumConfig as GroupByConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({})).toReject();
        await expect(makeSchema({ field: 'test' })).toResolve();
        await expect(makeSchema({ field: [12341234] })).toReject();
        await expect(makeSchema({ field: 12341234 })).toReject();
    });
});
