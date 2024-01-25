import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';

describe('script schema', () => {
    let harness: WorkerTestHarness;
    const name = 'script';

    async function makeSchema(config: AnyObject = {}): Promise<AnyObject> {
        const opConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as AnyObject;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should instantiate correctly and has defaults', async () => {
        const schema = await makeSchema();

        expect(schema).toMatchObject({
            _op: name,
            command: 'echo',
            args: [],
            options: {},
            asset: 'echo'
        });
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({ command: 123 })).toReject();
        await expect(makeSchema({ command: { some: 'stuff' } })).toReject();

        await expect(makeSchema({ asset: 123 })).toReject();
        await expect(makeSchema({ asset: { some: 'stuff' } })).toReject();
    });
});
