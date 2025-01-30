import { cloneDeep, DataEntity, isString } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { OpConfig } from '@terascope/job-components';

describe('json_parser', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<OpConfig> = {}) {
        const baseConfig = {
            _op: 'json_parser',
        };

        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should return empty array if input is an empty array', async () => {
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('should parse valid json', async () => {
        const data = [
            {
                _key: 1,
                name: 'bob'
            },
            {
                _key: 2,
                name: 'joe'
            },
        ];

        const rawData = makeRawDataEntities(cloneDeep(data));

        harness = await makeTest();
        const results = await harness.runSlice(rawData);

        expect(results).toEqual(data);
    });

    it('should only return the good json', async () => {
        const data = [
            'somebadjson',
            {
                _key: 2,
                name: 'joe'
            },
        ];

        const rawData = makeRawDataEntities(cloneDeep(data));

        harness = await makeTest();
        const results = await harness.runSlice(rawData);

        expect(results).toEqual([{ _key: 2, name: 'joe' }]);
    });

    it('should remove null values', async () => {
        /**
         * JSON.stringify converts the unicode null into a string literal
         * which does not duplicate the incoming data in this case.
         * This is why the makeRawDataEntities function isn't used for this test
         */
        const data = '{ "_key": "1234", "name": "\u0000joe\x00\x00" }';

        const entity = DataEntity.make({}, { _key: '1234' });
        entity.setRawData(Buffer.from(data, 'utf8'));

        harness = await makeTest();
        const results = await harness.runSlice([entity]);

        expect(results).toEqual([{ _key: '1234', name: 'joe' }]);
    });
});

function makeRawDataEntities(dataArray: any[]) {
    return dataArray.map((doc) => {
        let d = doc;
        if (isString(doc)) d = {};
        const entity = DataEntity.make(d, { _key: doc._key });

        const buf = Buffer.from(JSON.stringify(doc), 'utf8');

        entity.setRawData(buf);

        return entity;
    });
}
