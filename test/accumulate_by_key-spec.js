'use strict';

const { DataEntity } = require('@terascope/job-components');
const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/accumulate_by_key/processor.js');
const Schema = require('../asset/accumulate_by_key/schema.js');

const skipJunkDataEntity = require('./helpers/skip_junk_dataentity');

const opConfig = {
    _op: 'accumulate_by_key',
    type: 'string',
    empty_after: 0
};

const singleKeyData = [
    DataEntity.make({
        id: 1
    }, {
        _key: 1
    }),
    DataEntity.make({
        id: 3
    }, {
        _key: 1
    }),
    DataEntity.make({
        id: 2
    }, {
        _key: 1
    })
];

const multiKeyData = [
    DataEntity.make({
        id: 1
    }, {
        _key: 1
    }),
    DataEntity.make({
        id: 3
    }, {
        _key: 3
    }),
    DataEntity.make({
        id: 2
    }, {
        _key: 2
    })
];

describe('accumulate_by_key should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return results for a single key to be grouped together', async () => {
        const results = await testHarness.run(singleKeyData);

        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(3);

        // Each result is a DataWindow
        expect(results[0].getMetadata('_key')).toBe(1);

        results[0].asArray().forEach((record) => {
            expect(record.getMetadata('_key')).toBe(1);
        });
    });
});
