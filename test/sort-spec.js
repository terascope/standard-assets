'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const { DataEntity } = require('@terascope/utils');
const Processor = require('../asset/sort/processor.js');
const Schema = require('../asset/sort/schema.js');
const DataWindow = require('../asset/__lib/data-window');

const testData = [
    {
        id: 1
    },
    {
        id: 2,
        type: 'string'
    },
    {
        id: 3
    }
];

describe('sort should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sort',
                sort_field: 'id'
            }
        });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('sort input correctly', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);

        let next = 1;
        results.forEach((doc) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });
});

describe('sort should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    let opConfig;
    beforeEach(async () => {
        opConfig = {
            _op: 'sort',
            sort_field: 'id'
        };
    });

    // array of 3 windows, 10 unordered items in each window
    const dataWindows = [];
    for (let i = 0; i < 3; i++) {
        const dataArray = Array(10).fill().map(() => {
            const obj = { id: Math.floor(Math.random() * 1000) };
            return obj;
        });
        dataWindows.push(DataWindow.make(i, dataArray));
    }

    it('sort array of data windows correctly in ascending order', async () => {
        await testHarness.initialize({ opConfig });
        const results = await testHarness.run(dataWindows);

        // all items should be returned
        expect(results.length).toBe(3);

        // all items should be in asc order, can be equal to
        results.forEach((window) => {
            window.asArray().slice(1,).forEach((item, i) => {
                expect(item.id >= window.get(i).id).toBe(true);
            });
        });
    });

    it('sort array of data windows correctly in descending order', async () => {
        opConfig.order = 'desc';
        await testHarness.initialize({ opConfig });
        const results = await testHarness.run(dataWindows);

        // all items should be returned
        expect(results.length).toBe(3);

        // all items should be in asc order, can be equal to
        results.forEach((window) => {
            window.asArray().slice(1,).forEach((item, i) => {
                expect(item.id <= window.get(i).id).toBe(true);
            });
        });
    });
});

describe('sort should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sort',
                sort_field: 'id'
            }
        });
    });


    it('not treat data entities like data windows', async () => {
        const dataEntities = DataEntity.makeArray(testData);
        const results = await testHarness.run(dataEntities);
        expect(results.length).toBe(3);

        let next = 1;
        results.forEach((doc) => {
            expect(doc.id).toBe(next);
            next += 1;
        });
    });
});
