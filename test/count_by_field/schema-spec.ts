import 'jest-extended';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { CountByFieldConfig } from '../../asset/src/count_by_field/interfaces.js';

describe('count_by_field schema', () => {
    let harness: WorkerTestHarness;
    const name = 'count_by_field';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<CountByFieldConfig> {
        const opConfig:OpConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as CountByFieldConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        expect(await makeSchema({ field: 'node_id' })).toStrictEqual({
            _dead_letter_action: 'throw',
            _encoding: 'json',
            _op: 'count_by_field',
            collect_metrics: false,
            field: 'node_id',
        });
        expect(await makeSchema({ field: 'node_id' })).toStrictEqual({
            _dead_letter_action: 'throw',
            _encoding: 'json',
            _op: 'count_by_field',
            collect_metrics: false,
            field: 'node_id',
        });
        await expect(makeSchema({ field: 12341234 })).toReject();
        await expect(makeSchema({ field: { node_id: '1234' } })).toReject();
    });
});
