import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('Hash Router Processor', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    const key1 = 'someId1';
    const key2 = 'someId2';

    async function makeTest(config?: any) {
        const _op = {
            _op: 'hash_router',
            fields: [
                'field2',
                'field1'
            ]
        };
        const opConfig = config ? Object.assign({}, _op, config) : _op;

        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    beforeEach(() => {
        data = [
            DataEntity.make(
                {
                    date: '2020-01-17T19:21:52.159Z',
                    field1: 'val1.1',
                    field2: 'val1.2'
                },
                {
                    _key: key1
                }
            ),
            DataEntity.make(
                {
                    date: '2020-01-17T19:21:52.159Z',
                    field1: 'val2.1',
                    field2: 'val2.2'
                },
                {
                    _key: key2
                }
            ),
        ];
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('properly routes by buckets', async () => {
        await makeTest({ buckets: 15 });

        const [slice1, slice2] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('4');
        expect(slice2.getMetadata('standard:route')).toEqual('8');
    });

    it('properly routes by key if no fields are specified', async () => {
        await makeTest({ buckets: 15, fields: [] });

        const [slice1, slice2] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('0');
        expect(slice2.getMetadata('standard:route')).toEqual('14');
    });

    it('properly routes by key if no fields is null', async () => {
        await makeTest({ buckets: 15, fields: null });

        const [slice1, slice2] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('0');
        expect(slice2.getMetadata('standard:route')).toEqual('14');
    });
});
