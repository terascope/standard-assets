import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('Date path partitioner', () => {
    let harness: WorkerTestHarness;

    const data = [
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                text: 'test data'
            }
        )
    ];

    afterEach(async () => {
        await harness.shutdown();
    });

    it('properly adds a daily path', async () => {
        harness = WorkerTestHarness.testProcessor({
            _op: 'partition_by_date',
            field: 'date',
            resolution: 'daily'
        }, {});

        await harness.initialize();
        const [slice] = await harness.runSlice(data);
        expect(slice.getMetadata('_partition')).toEqual('date_year=2020/date_month=01/date_day=17');
    });

    it('properly adds a monthly path', async () => {
        harness = WorkerTestHarness.testProcessor({
            _op: 'partition_by_date',
            field: 'date',
            resolution: 'monthly'
        }, {});
        await harness.initialize();
        const slice = await harness.runSlice(data);
        expect(slice[0].getMetadata('_partition')).toEqual('date_year=2020/date_month=01');
    });

    it('properly adds a yearly path', async () => {
        harness = WorkerTestHarness.testProcessor({
            _op: 'partition_by_date',
            field: 'date',
            resolution: 'yearly'
        }, {});
        await harness.initialize();
        const slice = await harness.runSlice(data);
        expect(slice[0].getMetadata('_partition')).toEqual('date_year=2020');
    });
});
