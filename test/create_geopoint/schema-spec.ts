import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('create_geopoint schema', () => {
    let harness: WorkerTestHarness;
    const name = 'create_geopoint';

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
        await expect(makeSchema({ lat_field: 'latitude' })).toReject();
        await expect(makeSchema({ lon_field: 'longitude' })).toReject();
        await expect(makeSchema({ lat_field: 'latitude', lon_field: 'longitude' })).toResolve();
        await expect(makeSchema({
            lat_field: 'latitude', lon_field: 'longitude', destination: 'location', delete_source: true
        })).toResolve();
        await expect(makeSchema({ lat_field: 1234, lon_field: 'longitude' })).toReject();
        await expect(makeSchema({ lat_field: 'latitude', lon_field: 'longitude', delete_source: 'nope' })).toReject();
    });

    it('should default destination to "location" and delete_source to true', async () => {
        const config = await makeSchema({ lat_field: 'latitude', lon_field: 'longitude' });

        expect(config.destination).toBe('location');
        expect(config.delete_source).toBe(true);
    });
});
