import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('create_geopoint should', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

    beforeEach(() => {
        data = [
            {
                id: 1,
                latitude: 40,
                longitude: 60
            },
            {
                id: 2,
                latitude: -33.87,
                longitude: 151.21
            }
        ];
    });

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'create_geopoint',
            lat_field: 'latitude',
            lon_field: 'longitude'
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

    it('build a { lat, lon } geo-point in location and drop the source fields by default', async () => {
        const test = await makeTest();
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                location: { lat: 40, lon: 60 }
            },
            {
                id: 2,
                location: { lat: -33.87, lon: 151.21 }
            }
        ]);
    });

    it('keep the source fields when delete_source is false', async () => {
        const test = await makeTest({ delete_source: false });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                id: 1,
                latitude: 40,
                longitude: 60,
                location: { lat: 40, lon: 60 }
            },
            {
                id: 2,
                latitude: -33.87,
                longitude: 151.21,
                location: { lat: -33.87, lon: 151.21 }
            }
        ]);
    });

    it('write to a custom destination field', async () => {
        const test = await makeTest({ destination_field: 'geo' });
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results[0].geo).toEqual({ lat: 40, lon: 60 });
        expect(results[1].geo).toEqual({ lat: -33.87, lon: 151.21 });
    });

    it('accept string values for lat/lon', async () => {
        const test = await makeTest();
        const results = await test.runSlice([{ id: 1, latitude: '40', longitude: '60' }]) as DataEntity[];

        expect(results[0].location).toEqual({ lat: 40, lon: 60 });
    });

    it('drop the source fields on missing lat/lon by default and set no location', async () => {
        const test = await makeTest();
        const results = await test.runSlice([{ id: 1, latitude: 40 }]) as DataEntity[];

        expect(results).toEqual([{ id: 1 }]);
    });

    it('drop the source fields on invalid lat/lon by default and set no location', async () => {
        const test = await makeTest();
        const results = await test.runSlice([
            { id: 1, latitude: 'nope', longitude: 'nope' },
            { id: 2, latitude: 40, longitude: 60 }
        ]) as DataEntity[];

        expect(results).toEqual([
            { id: 1 },
            { id: 2, location: { lat: 40, lon: 60 } }
        ]);
    });

    it('keep the source fields on failure when delete_source is false', async () => {
        const test = await makeTest({ delete_source: false });
        const results = await test.runSlice([{ id: 1, latitude: 'nope', longitude: 'nope' }]) as DataEntity[];

        expect(results).toEqual([{ id: 1, latitude: 'nope', longitude: 'nope' }]);
    });

    it('build a geo-point for each record in a data window', async () => {
        const testWindow = [
            DataWindow.make('1', [
                { id: 1, latitude: 40, longitude: 60 },
                { id: 2, latitude: 10, longitude: 20 }
            ])
        ];
        const test = await makeTest();

        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        expect(results[0].asArray()[0].location).toEqual({ lat: 40, lon: 60 });
        expect(results[0].asArray()[1].location).toEqual({ lat: 10, lon: 20 });
    });
});
