import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('Date path partitioner', () => {
    let harness: WorkerTestHarness;

    const data = [
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                field1: 'val1',
                field2: 'val2'
            }
        ),
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                field1: 'val/1',
                field2: 'val/2'
            }
        ),
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                field1: 'val=1',
                field2: 'val=2'
            }
        )
    ];

    afterEach(async () => {
        await harness.shutdown();
    });

    it('properly adds partition with specified keys', async () => {
        harness = WorkerTestHarness.testProcessor({
            _op: 'partition_by_fields',
            fields: [
                'field2',
                'field1'
            ]
        }, {});

        await harness.initialize();

        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:partition')).toEqual('field2=val2/field1=val1');
        expect(slice2.getMetadata('standard:partition')).toEqual('field2=val_2/field1=val_1');
        expect(slice3.getMetadata('standard:partition')).toEqual('field2=val_2/field1=val_1');
    });
});
