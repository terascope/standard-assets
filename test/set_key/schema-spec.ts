import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { SetKeyConfig } from '../../asset/src/set_key/interfaces';

describe('set_key schema', () => {
    let harness: WorkerTestHarness;
    const name = 'set_key';

    async function makeSchema(config: AnyObject = {}): Promise<SetKeyConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const accumConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return accumConfig as SetKeyConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({ field: { some: 'stuff' } })).toResolve();
        await expect(makeSchema({ field: 12341234 })).toReject();
    });
});
