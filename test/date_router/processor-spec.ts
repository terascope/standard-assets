import { DataEntity, AnyObject } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DateResolution } from '@terascope/standard-asset-apis';

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
        expect(slice.getMetadata('standard:route')).toEqual('2020.01.17');
    });

    it('properly adds a daily parameter with no delimiter', async () => {
        const test = await makeTest({
            resolution: DateResolution.daily,
            date_delimiter: ''
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('20200117');
    });

    it('properly uses clock time for the date when set to true', async () => {
        const test = await makeTest({
            resolution: DateResolution.daily,
            field: 'date',
            use_clock_time: true
        });

        const [slice] = await test.runSlice(data);
        const [year, month, day] = new Date().toISOString()
            .split('-');
        const [date] = day.split('T');

        expect(slice.getMetadata('standard:route')).toEqual(`${year}.${month}.${date}`);
    });

    it('properly adds a daily parameter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.daily,
            include_date_units: true
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('year_2020.month_01.day_17');
    });

    it('properly adds a daily parameter with fields and no date_unit_delimiter', async () => {
        const test = await makeTest({
            resolution: DateResolution.daily,
            include_date_units: true,
            date_delimiter: '-',
            date_unit_delimiter: ''
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('year2020-month01-day17');
    });

    it('properly adds a weekly parameter', async () => {
        const test = await makeTest({
            resolution: DateResolution.weekly
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('2020.02');
    });

    it('properly adds a weekly parameter for weeks greater than 10', async () => {
        const test = await makeTest({
            resolution: DateResolution.weekly,
            date_delimiter: '-'
        });

        data[0].date = '2021-08-22T19:21:52.159Z';

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('2021-33');
    });

    it('properly adds a weekly parameter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.weekly,
            include_date_units: true,
            date_delimiter: '-'
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('year_2020-week_02');
    });

    it('properly adds a weekly_epoch parameter', async () => {
        const test = await makeTest({
            resolution: DateResolution.weekly_epoch
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('2611');
    });

    it('properly adds a weekly_epoch parameter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.weekly_epoch,
            include_date_units: true
        });

        const [slice] = await test.runSlice(data);
        expect(slice.getMetadata('standard:route')).toEqual('week_2611');
    });

    it('properly adds a monthly parameter', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('2020.01');
    });

    it('properly adds a monthly parameter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly,
            include_date_units: true,
            date_delimiter: '-'
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020-month_01');
    });

    it('properly adds a monthly parameter with another date_delimiter', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly,
            date_delimiter: '.'
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('2020.01');
    });

    it('properly adds a monthly parameter with another date_delimiter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.monthly,
            date_delimiter: '.',
            include_date_units: true
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year_2020.month_01');
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

    it('properly does not add a yearly parameter with another date_unit_delimiter if include_date_units is set to true', async () => {
        const test = await makeTest({
            resolution: DateResolution.yearly,
            date_unit_delimiter: '/'
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('2020');
    });

    it('properly adds a yearly parameter with another date_unit_delimiter with fields', async () => {
        const test = await makeTest({
            resolution: DateResolution.yearly,
            date_unit_delimiter: '/',
            include_date_units: true
        });

        const slice = await test.runSlice(data);
        expect(slice[0].getMetadata('standard:route')).toEqual('year/2020');
    });
});
