'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/window/processor.js');
const Schema = require('../asset/window/schema.js');

const testData = [
    {
        id: 1,
        time: '2019-04-25T18:12:00.000Z'
    },
    {
        id: 2,
        time: '2019-04-25T18:12:01.000Z'
    },
    {
        id: 3,
        time: '2019-04-25T18:12:02.000Z'
    }
];

describe('window should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    let opConfig;

    beforeEach(() => {
        opConfig = {
            _op: 'window',
            window_size: 1000,
            time_field: 'time'
        };
    });

    it('generate an empty result if no input data', async () => {
        await testHarness.initialize({ opConfig });
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return all the docs if they cover the window size', async () => {
        await testHarness.initialize({ opConfig });
        let results = await testHarness.run(testData);
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(3);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return all the docs if they cover the window size', async () => {
        await testHarness.initialize({ opConfig });

        let results = await testHarness.run(testData);
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(3);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('not return any data if window is not expired', async () => {
        opConfig.window_size = 30000;
        await testHarness.initialize({ opConfig });
        let results = await testHarness.run(testData);
        expect(results.length).toBe(0);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return data as windows expire', async () => {
        opConfig.window_size = 7000;

        const data = [];
        let time = new Date();
        for (let i = 0; i < 20; i++) {
            time = new Date(Date.parse(time) + 1000).toISOString();
            const doc = {
                time
            };
            data.push(doc);
        }

        await testHarness.initialize({ opConfig });
        let results = await testHarness.run(data.slice(0, 3));
        expect(results.length).toBe(0);

        results = await testHarness.run(data.slice(3, 6));
        expect(results.length).toBe(0);

        // window expires
        results = await testHarness.run(data.slice(6, 9));
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(9);

        results = await testHarness.run(data.slice(9, 12));
        expect(results.length).toBe(0);

        results = await testHarness.run(data.slice(12, 15));
        expect(results.length).toBe(0);

        // window expires
        results = await testHarness.run(data.slice(15, 18));
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(9);

        results = await testHarness.run(data.slice(18,));
        expect(results.length).toBe(0);
    });
});

describe('window should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    let opConfig;

    beforeEach(() => {
        opConfig = {
            _op: 'window',
            window_size: 1,
            time_field: 'time',
            time_type: 'clock',
        };
    });

    it('window data based on clock time', async () => {
        const data = [];
        let time = new Date();

        for (let i = 0; i < 10000; i++) {
            time = new Date(Date.parse(time) + 100).toISOString();
            const doc = {
                time
            };
            data.push(doc);
        }

        opConfig.window_size = 50;
        await testHarness.initialize({ opConfig });

        // first slice processed before window expires
        let results = await testHarness.run(data);
        expect(results.length).toBe(0);

        // need to hold the next slice until window time is expired
        setTimeout(async () => {
            results = await testHarness.run(data);
            expect(results.length).toBe(1);
            // all the data comes back
            expect(results[0].asArray().length).toBe(20000);

            results = await testHarness.run([]);
            expect(results.length).toBe(0);
        }, 1000);
    });
});

describe('window should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    let opConfig;

    beforeEach(() => {
        opConfig = {
            _op: 'window',
            window_size: 6000,
            window_type: 'sliding',
            sliding_window_interval: 3000,
            time_field: 'time',
            time_type: 'event'
        };
    });

    fit('use sliding windows and assign docs to correct windows ', async () => {
        const data = [];
        let time = new Date();

        for (let i = 0; i < 10; i++) {
            time = new Date(Date.parse(time) + 1000).toISOString();
            const doc = {
                time
            };
            data.push(doc);
        }

        await testHarness.initialize({ opConfig });

        let results = await testHarness.run(data);

        // should return one window
        expect(results.length).toBe(1);

        results = await testHarness.run([{ time: new Date(Date.parse(time) + 10000) }]);
        expect(results.length).toBe(1);
    });
});
