import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { FromOptions, CaseOptions } from '../../asset/src/key_router/interfaces';

describe('Key path partitioner', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    const key1 = 'DaTaEnTiTyK3Y';
    const key2 = 'DaTaEnTiTy/K3Y';
    const key3 = 'DaTaEnTiTy=K3Y';

    async function makeTest(config?: any) {
        const _op = { _op: 'key_router' };
        const opConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    beforeEach(async () => {
        data = [
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
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('properly adds the key to metadata', async () => {
        harness = await makeTest();
        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual(key1);
        expect(slice2.getMetadata('standard:route')).toEqual(key2);
        expect(slice3.getMetadata('standard:route')).toEqual(key3);
    });

    it('can change key to lowercase case', async () => {
        harness = await makeTest({ case: CaseOptions.lower });
        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual(key1.toLowerCase());
        expect(slice2.getMetadata('standard:route')).toEqual(key2.toLowerCase());
        expect(slice3.getMetadata('standard:route')).toEqual(key3.toLowerCase());
    });

    it('can change key to uppercase case', async () => {
        harness = await makeTest({ case: CaseOptions.upper });
        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual(key1.toUpperCase());
        expect(slice2.getMetadata('standard:route')).toEqual(key2.toUpperCase());
        expect(slice3.getMetadata('standard:route')).toEqual(key3.toUpperCase());
    });

    it('can extract key from start', async () => {
        harness = await makeTest({ from: FromOptions.beginning, use: 1 });
        const slices = await harness.runSlice(data);
        const keys = [key1, key2, key3].map((key) => key.slice(0, 1));

        keys.forEach((key, index) => {
            const results = slices[index].getMetadata('standard:route');
            expect(results).toEqual((key));
        });
    });

    it('can extract key from end', async () => {
        harness = await makeTest({ from: FromOptions.end, use: 1 });
        const slices = await harness.runSlice(data);
        const keys = [key1, key2, key3].map((key) => key.slice(-1));

        keys.forEach((key, index) => {
            const results = slices[index].getMetadata('standard:route');
            expect(results).toEqual((key));
        });
    });
});
