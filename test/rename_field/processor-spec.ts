import 'jest-extended';
import { DataEntity, cloneDeep } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';
import DataWindow from '../../asset/src/__lib/data-window.js';

describe('rename_field should', () => {
    let harness: WorkerTestHarness;
    let data: Record<string, any>[];

    beforeEach(() => {
        data = [
            {
                STATION: 'ACW00011647',
                LATITUDE: 17.1333,
                LONGITUDE: -61.7833,
                wind_speed: 0
            },
            {
                STATION: 'ACW00011648',
                LATITUDE: 40,
                LONGITUDE: 60,
                wind_speed: 1.5
            }
        ];
    });

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'rename_field',
            mapping: { STATION: 'station', LATITUDE: 'latitude', LONGITUDE: 'longitude' }
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

    it('rename mapped fields and remove the originals', async () => {
        const test = await makeTest();
        const results = await test.runSlice(cloneDeep(data)) as DataEntity[];

        expect(results).toEqual([
            {
                station: 'ACW00011647',
                latitude: 17.1333,
                longitude: -61.7833,
                wind_speed: 0
            },
            {
                station: 'ACW00011648',
                latitude: 40,
                longitude: 60,
                wind_speed: 1.5
            }
        ]);
    });

    it('preserve falsy values (0, "", false) when renaming', async () => {
        const test = await makeTest({ mapping: { a: 'x', b: 'y', c: 'z' } });
        const results = await test.runSlice([{ a: 0, b: '', c: false }]) as DataEntity[];

        expect(results).toEqual([{ x: 0, y: '', z: false }]);
    });

    it('skip fields in the mapping that are not present on the record', async () => {
        const test = await makeTest({ mapping: { LATITUDE: 'latitude', MISSING: 'missing' } });
        const results = await test.runSlice([{ LATITUDE: 40, other: 1 }]) as DataEntity[];

        expect(results).toEqual([{ latitude: 40, other: 1 }]);
    });

    it('leave the record unchanged when a field is mapped to its own name', async () => {
        const test = await makeTest({ mapping: { name: 'name' } });
        const results = await test.runSlice([{ name: 'joe', age: 30 }]) as DataEntity[];

        expect(results).toEqual([{ name: 'joe', age: 30 }]);
    });

    it('rename fields for each record in a data window', async () => {
        const testWindow = [
            DataWindow.make('1', [
                { STATION: 'a', LATITUDE: 1, LONGITUDE: 2 },
                { STATION: 'b', LATITUDE: 3, LONGITUDE: 4 }
            ])
        ];
        const test = await makeTest();

        const results = await test.runSlice(testWindow) as DataEntity[];

        results.forEach((doc) => expect(DataEntity.isDataEntity(doc)).toBe(true));

        expect(results[0].asArray()[0]).toEqual({ station: 'a', latitude: 1, longitude: 2 });
        expect(results[0].asArray()[1]).toEqual({ station: 'b', latitude: 3, longitude: 4 });
    });
});
