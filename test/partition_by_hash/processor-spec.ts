import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('Date path partitioner', () => {
    let harness: WorkerTestHarness;

    const data = [
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                field1: 'val1.1',
                field2: 'val1.2'
            }
        ),
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                field1: 'val2.1',
                field2: 'val2.2'
            }
        ),
    ];

    afterEach(async () => {
        await harness.shutdown();
    });

    it('properly adds partition with specified keys', async () => {
        harness = WorkerTestHarness.testProcessor({
            _op: 'partition_by_hash',
            fields: [
                'field2',
                'field1'
            ],
            partitions: 15
        });

        await harness.initialize();

        const [slice1, slice2] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:partition')).toEqual('partition=4');
        expect(slice2.getMetadata('standard:partition')).toEqual('partition=8');
    });
});
