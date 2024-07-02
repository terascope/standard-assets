import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import { SetKeyConfig } from '../../asset/src/set_key/interfaces.js';

describe('stdout schema', () => {
    let harness: WorkerTestHarness;
    const name = 'stdout';

    async function makeSchema(config: AnyObject = {}): Promise<SetKeyConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);
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
        await expect(makeSchema({ limit: { some: 'stuff' } })).toReject();
        await expect(makeSchema({ limit: 'hello' })).toReject();
        await expect(makeSchema({ field: 12 })).not.toReject();
    });
});
