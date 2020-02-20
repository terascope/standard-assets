import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('Key path partitioner', () => {
    let harness: WorkerTestHarness;

    const key1 = 'DaTaEnTiTyK3Y';
    const key2 = 'DaTaEnTiTy/K3Y';
    const key3 = 'DaTaEnTiTy=K3Y';

    const data = [
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                text: 'test data'
            },
            {
                _key: key1
            }
        ),
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                text: 'test data'
            },
            {
                _key: key2
            }
        ),
        DataEntity.make(
            {
                date: '2020-01-17T19:21:52.159Z',
                text: 'test data'
            },
            {
                _key: key3
            }
        )
    ];

    afterEach(async () => {
        await harness.shutdown();
    });

    it('properly adds the key to the path', async () => {
        harness = WorkerTestHarness.testProcessor({
            _op: 'partition_by_key',
        });

        await harness.initialize();
        // Need this in order to feed the record in with the metadata
        harness.fetcher().handle = async () => data;
        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('_partition')).toEqual(key1);
        expect(slice2.getMetadata('_partition')).toEqual(key2);
        expect(slice3.getMetadata('_partition')).toEqual(key3);
    });
});
