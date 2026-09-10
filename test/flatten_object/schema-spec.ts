import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('flatten_object schema', () => {
    let harness: WorkerTestHarness;
    const name = 'flatten_object';

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
        await expect(makeSchema({})).toResolve();
        await expect(makeSchema({ delimiter: '_' })).toResolve();
        await expect(makeSchema({ max_depth: 3 })).toResolve();
        await expect(makeSchema({ delimiter: '::', max_depth: 1 })).toResolve();

        await expect(makeSchema({ flatten_arrays: true })).toResolve();
        await expect(makeSchema({ flatten_arrays: 'nope' })).toReject();

        await expect(makeSchema({ max_depth: -1 })).toReject();
        await expect(makeSchema({ max_depth: 1.5 })).toReject();
        await expect(makeSchema({ max_depth: 'two' })).toReject();
        await expect(makeSchema({ delimiter: 1234 })).toReject();
    });

    it('should accept a field name, "all", or an array of field names', async () => {
        await expect(makeSchema({ field: 'all' })).toResolve();
        await expect(makeSchema({ field: ['all'] })).toResolve();
        await expect(makeSchema({ field: 'location' })).toResolve();
        await expect(makeSchema({ field: 'location.geo' })).toResolve();
        await expect(makeSchema({ field: ['location'] })).toResolve();
        await expect(makeSchema({ field: ['location.geo', 'meta'] })).toResolve();

        await expect(makeSchema({ field: '' })).toReject();
        await expect(makeSchema({ field: [] })).toReject();
        await expect(makeSchema({ field: ['location', ''] })).toReject();
        await expect(makeSchema({ field: ['location', 1234] })).toReject();
        await expect(makeSchema({ field: 1234 })).toReject();
    });

    it('should accept a wildcard anywhere but the end of a path', async () => {
        await expect(makeSchema({ field: 'locations.*.geo' })).toResolve();
        await expect(makeSchema({ field: 'locations[].geo' })).toResolve();
        await expect(makeSchema({ field: 'locations[*].geo' })).toResolve();
        await expect(makeSchema({ field: 'locations[0].geo' })).toResolve();
        await expect(makeSchema({ field: 'a.*.b.*.c' })).toResolve();
        await expect(makeSchema({ field: ['locations.*.geo', 'meta'] })).toResolve();

        // there is no parent to dissolve each match into
        await expect(makeSchema({ field: 'locations.*' })).toReject();
        await expect(makeSchema({ field: 'locations[]' })).toReject();
        await expect(makeSchema({ field: 'locations[*]' })).toReject();
        await expect(makeSchema({ field: '*' })).toReject();
        await expect(makeSchema({ field: ['meta', 'locations.*'] })).toReject();
    });

    it('should only accept a known missing_field_action', async () => {
        await expect(makeSchema({ missing_field_action: 'throw' })).toResolve();
        await expect(makeSchema({ missing_field_action: 'log' })).toResolve();
        await expect(makeSchema({ missing_field_action: 'ignore' })).toResolve();

        await expect(makeSchema({ missing_field_action: 'nope' })).toReject();
    });

    it('should set the expected defaults', async () => {
        const config = await makeSchema({}) as OpConfig & {
            field: string;
            delimiter: string;
            flatten_arrays: boolean;
            max_depth: number;
            missing_field_action: string;
        };

        expect(config.field).toBe('all');
        expect(config.delimiter).toBe('.');
        expect(config.flatten_arrays).toBe(false);
        expect(config.max_depth).toBe(0);
        expect(config.missing_field_action).toBe('ignore');
    });
});
