import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { WindowConfig, TimeSetting, WindowType } from '../../asset/src/window/interfaces.js';
import { OpConfig } from '@terascope/job-components';

describe('window Schema', () => {
    let harness: WorkerTestHarness;
    const name = 'window';

    async function makeSchema(config: Partial<OpConfig> = {}): Promise<WindowConfig> {
        const opConfig: OpConfig = Object.assign({}, { _op: name }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as WindowConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    describe('when validating the schema', () => {
        it('should expect to be properly configured', async () => {
            await expect(makeSchema({ time_field: 12341 })).toReject();
            await expect(makeSchema({ window_time_setting: 'test' })).toReject();
            await expect(makeSchema({ window_length: [12341234] })).toReject();
            await expect(makeSchema({ window_length: -12341 })).toReject();
            await expect(makeSchema({ window_type: 'hello' })).toReject();
            await expect(makeSchema({ sliding_window_interval: -1234 })).toReject();
            await expect(makeSchema({ event_window_expiration: -1234 })).toReject();

            await expect(makeSchema({
                time_field: 'someField',
                window_time_setting: TimeSetting.clock,
                window_length: 10,
                window_type: WindowType.sliding,
                sliding_window_interval: 10,
                event_window_expiration: 0,
            })).toResolve();
        });
    });
});
