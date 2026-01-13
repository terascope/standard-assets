import 'jest-extended';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { SetKeyConfig } from '../../asset/src/set_key/interfaces.js';

describe('set_key schema', () => {
    let harness: WorkerTestHarness;
    const name = 'set_key';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<SetKeyConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as SetKeyConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({ field: { some: 'stuff' } })).toReject();
        await expect(makeSchema({ field: 12341234 })).toReject();
    });
});
