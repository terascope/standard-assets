import { DataEntity, AnyObject } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DateResolution } from '../../asset/src/date_router/interfaces';

describe('date_router', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'date_router',
            field: 'date',
        };
        const opConfig = Object.assign({}, _op, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

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
        const test = await makeTest({
            resolution: DateResolution.daily
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('2020-01-17');
    });

    it('properly adds a daily parameter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.daily,
            include_date_units: true
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('year_2020-month_01-day_17');
    });

    it('properly adds a monthly parameter', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('2020-01');
    });

    it('properly adds a monthly parameter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly,
            include_date_units: true
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020-month_01');
    });

    it('properly adds a monthly parameter with another field_delimiter', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly,
            field_delimiter: '.'
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('2020.01');
    });

    it('properly adds a monthly parameter with another field_delimiter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly,
            field_delimiter: ' > ',
            include_date_units: true
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020 > month_01');
    });

    it('properly adds a yearly parameter', async () => {
        const test = await makeTest({
            resolution: DateResolution.yearly
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('2020');
    });

    it('properly adds a yearly parameter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.yearly,
            include_date_units: true
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020');
    });

    it('properly does not add a yearly parameter with another value_delimiter if include_date_units is set to true', async () => {
        const test = await makeTest({
            resolution: DateResolution.yearly,
            value_delimiter: '&'
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('2020');
    });

    it('properly adds a yearly parameter with another value_delimiter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.yearly,
            value_delimiter: '&',
            include_date_units: true
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year&2020');
    });
});
