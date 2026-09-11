import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('add_date should', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

    const isoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    beforeEach(() => {
        data = [
            {
                id: 1,
                name: 'joe'
            },
            {
                id: 2,
                name: 'moe'
            },
            {
                id: 3,
                name: 'randy'
            }
        ];
    });

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'add_date',
            field: 'date'
        };
        const opConfig: OpConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('generate an empty result if no input data', async () => {
        const test = await makeTest();
        const results = await test.runSlice([]);

        expect(results).toBeArrayOfSize(0);
    });

    it('return data with an ISO date added to the configured field', async () => {
        const test = await makeTest();
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toBeArrayOfSize(3);

        results.forEach((doc) => {
            expect(doc.date).toMatch(isoDate);
            expect(new Date(doc.date).toISOString()).toBe(doc.date);
        });
    });

    it('leave the other fields on the record untouched', async () => {
        const test = await makeTest();
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results[0].id).toBe(1);
        expect(results[0].name).toBe('joe');
    });

    it('write to a nested field', async () => {
        const test = await makeTest({ field: 'meta.processed_at' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => expect(doc.meta.processed_at).toMatch(isoDate));
    });

    it('default to an iso_8601 formatted date', async () => {
        const test = await makeTest({ format: 'iso_8601' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => expect(doc.date).toMatch(isoDate));
    });

    it('return epoch millis as a number', async () => {
        const before = Date.now();
        const test = await makeTest({ format: 'epoch_millis' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(typeof doc.date).toBe('number');
            expect(doc.date).toBeGreaterThanOrEqual(before);
            expect(doc.date).toBeLessThanOrEqual(Date.now());
        });
    });

    it('return epoch seconds as a number', async () => {
        const before = Math.floor(Date.now() / 1000);
        const test = await makeTest({ format: 'epoch' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(typeof doc.date).toBe('number');
            expect(doc.date).toBeGreaterThanOrEqual(before);
            expect(doc.date).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
        });
    });

    it('treat milliseconds and seconds as aliases of the epoch formats', async () => {
        const msTest = await makeTest({ format: 'milliseconds' });
        const msResults = await msTest.runSlice(cloneDeep(data)) as DataEntity[];

        expect(String(msResults[0].date)).toMatch(/^\d{13}$/);

        await msTest.shutdown();

        const secTest = await makeTest({ format: 'seconds' });
        const secResults = await secTest.runSlice(cloneDeep(data)) as DataEntity[];

        expect(String(secResults[0].date)).toMatch(/^\d{10}$/);
    });

    it('accept a date-fns format string', async () => {
        const test = await makeTest({ format: 'yyyy-MM-dd' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => expect(doc.date).toMatch(/^\d{4}-\d{2}-\d{2}$/));
    });

    it('accept a date-fns format string with time segments', async () => {
        const test = await makeTest({ format: 'yyyy-MM-dd HH:mm' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => expect(doc.date).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
    });

    it('render a date-fns format string in UTC', async () => {
        // a plain format string has no x/X token, so formatDateValue shifts the
        // value to render the UTC wall clock rather than the worker's local time
        const before = new Date().toISOString()
            .slice(0, 10);
        const test = await makeTest({ format: 'yyyy-MM-dd' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];
        const after = new Date().toISOString()
            .slice(0, 10);

        results.forEach((doc) => expect([before, after]).toContain(doc.date));
    });

    it('render a date-fns format string with an X token in local time', async () => {
        const test = await makeTest({ format: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        results.forEach((doc) => {
            expect(doc.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(Z|[+-]\d{2}:\d{2})$/);
            // still the same instant, just expressed with a local offset
            expect(Math.abs(Date.now() - new Date(doc.date).getTime())).toBeLessThan(60_000);
        });
    });

    it('not overwrite the field if it already exists', async () => {
        const existing = '2020-01-01T00:00:00.000Z';
        const test = await makeTest();
        const results = await test.runSlice(
            data.map((doc) => ({ ...doc, date: existing }))
        ) as DataEntity[];

        results.forEach((doc) => expect(doc.date).toBe(existing));
    });

    it('overwrite the field if it already exists and overwrite is true', async () => {
        const existing = '2020-01-01T00:00:00.000Z';
        const test = await makeTest({ overwrite: true });
        const results = await test.runSlice(
            data.map((doc) => ({ ...doc, date: existing }))
        ) as DataEntity[];

        results.forEach((doc) => {
            expect(doc.date).toMatch(isoDate);
            expect(doc.date).not.toBe(existing);
        });
    });

    it('add a date to each record of a data window', async () => {
        const testWindow = [
            DataWindow.make('1', [{ id: 1, name: 'joe' }, { id: 2, name: 'moe' }, { id: 3, name: 'randy' }]),
            DataWindow.make('2', [{ id: 4, name: 'floe' }, { id: 5, name: 'noe' }, { id: 6, name: 'blandy' }])
        ];
        const test = await makeTest();

        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        results.forEach((window) => {
            window.asArray().forEach((doc: DataEntity) => {
                expect(doc.date).toMatch(isoDate);
            });
        });
    });
});
