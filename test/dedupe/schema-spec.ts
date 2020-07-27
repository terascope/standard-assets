import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { DedupConfig } from '../../asset/src/dedupe/interfaces';

describe('dedupe schema', () => {
    let harness: WorkerTestHarness;
    const name = 'dedupe';

    async function makeSchema(config: AnyObject = {}): Promise<DedupConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return accumConfig as DedupConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ field: 'test' })).toResolve();
        await expect(makeSchema({ field: 12341234 })).toReject();

        await expect(makeSchema({ adjust_time: 12341234 })).toReject();
        await expect(makeSchema({ adjust_time: ['asdf'] })).toReject();

        await expect(makeSchema({ adjust_time: [{ field: 'hello' }] })).toReject();
        await expect(makeSchema({ adjust_time: [{ preference: 'hello' }] })).toReject();
        await expect(makeSchema({ adjust_time: [{ preference: 'newest' }] })).toReject();

        await expect(makeSchema({ adjust_time: [{ field: 'hello', preference: 'newest' }] })).toResolve();
    });
});
