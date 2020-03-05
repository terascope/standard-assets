import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DateResolution } from '../../asset/src/date_router/interfaces';

describe('date_router', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    async function makeTest(config?: any) {
        const _op = {
            _op: 'date_router',
            field: 'date',
        };
        const opConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();
        // Need this in order to feed the record in with the metadata
        harness.fetcher().handle = async () => data;
        return harness;
    }

    beforeEach(() => {
        data = [
            DataEntity.make(
                {
                    date: '2020-01-17T19:21:52.159Z',
                    text: 'test data'
                }
            )
        ];
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('properly adds a daily parameter', async () => {
        harness = await makeTest({
            resolution: DateResolution.daily
        });

        const [slice] = await harness.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('year_2020-month_01-day_17');
    });

    it('properly adds a monthly parameter', async () => {
        harness = await makeTest({
            resolution: DateResolution.monthly
        });

        const slice = await harness.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020-month_01');
    });

    it('properly adds a monthly parameter with another field_delimiter', async () => {
        harness = await makeTest({
            resolution: DateResolution.monthly,
            field_delimiter: ' > '
        });

        const slice = await harness.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020 > month_01');
    });

    it('properly adds a yearly parameter', async () => {
        harness = await makeTest({
            resolution: DateResolution.yearly
        });

        const slice = await harness.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020');
    });

    it('properly adds a yearly parameter with another value_delimiter', async () => {
        harness = await makeTest({
            resolution: DateResolution.yearly,
            value_delimiter: '&'
        });

        const slice = await harness.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year&2020');
    });
});
