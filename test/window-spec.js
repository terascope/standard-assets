'use strict';


const util = require('util');
const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/window/processor.js');
const Schema = require('../asset/window/schema.js');

const setTimeoutPromise = util.promisify(setTimeout);

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
            window_length: 1000,
            time_field: 'time',
            event_window_expiration: 1
        };
    });

    it('generate an empty result if no input data', async () => {
        await testHarness.initialize({ opConfig });
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return the docs in the window frame', async () => {
        await testHarness.initialize({ opConfig });
        let results = await testHarness.run(testData);
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(2);

        results = await testHarness.run([{ id: 4, time: '2019-04-25T18:12:04.000Z' }]);
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(1);
    });

    it('not return any data if window is not expired', async () => {
        opConfig.event_window_expiration = 30000;
        opConfig.window_length = 30000;
        await testHarness.initialize({ opConfig });

        let results = await testHarness.run(testData);
        expect(results.length).toBe(0);

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('return data as windows expire', async () => {
        opConfig.window_length = 7000;
        opConfig.event_window_expiration = 100;

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
        expect(results[0].asArray().length).toBe(8);

        results = await testHarness.run(data.slice(9, 12));
        expect(results.length).toBe(0);

        results = await testHarness.run(data.slice(12, 15));
        expect(results.length).toBe(0);

        // window expires
        results = await testHarness.run(data.slice(15, 18));
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(8);

        results = await testHarness.run(data.slice(18,));
        expect(results.length).toBe(0);

        // all event windows should be expired by now
        await setTimeoutPromise(250)
            .then(() => testHarness.run([]))
            .then((window) => {
                expect(window.length).toBe(1);
                expect(window[0].asArray().length).toBe(4);
            });

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('handle data with same times', async () => {
        opConfig.window_length = 1000;
        opConfig.event_window_expiration = 2;

        const data = [];
        const time = new Date();
        for (let i = 0; i < 5; i++) {
            const doc = {
                time: time.toISOString(),
                id: i
            };
            data.push(doc);
        }

        await testHarness.initialize({ opConfig });
        let results = await testHarness.run(data);
        expect(results.length).toBe(0);

        // all event windows should be expired by now
        await setTimeoutPromise(250)
            .then(() => testHarness.run([]))
            .then((window) => {
                expect(window.length).toBe(1);
                expect(window[0].asArray().length).toBe(5);
            });

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('handle out of order data', async () => {
        opConfig.window_length = 5000;
        opConfig.event_window_expiration = 100;

        const time = new Date();

        const data = [
            {
                id: 1,
                time: time.getTime()
            },
            {
                id: 2,
                time: time.getTime() - 1000
            },
            {
                id: 5,
                time: time.getTime() + 6000
            }
        ];


        await testHarness.initialize({ opConfig });
        let results = await testHarness.run(data);
        expect(results.length).toBe(1);
        expect(results[0].asArray().length).toBe(2);

        // all event windows should be expired by now
        await setTimeoutPromise(250)
            .then(() => testHarness.run([]))
            .then((window) => {
                expect(window.length).toBe(1);
                expect(window[0].asArray().length).toBe(1);
            });

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });
});

describe('window should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    let opConfig;

    beforeEach(() => {
        opConfig = {
            _op: 'window',
            window_length: 100,
            time_field: 'time',
            window_time_setting: 'clock',
        };
    });

    it('assign window data based on clock time', async () => {
        const data = [];

        for (let i = 0; i < 3000; i++) {
            const doc = {
                id: i,
                time: new Date()
            };
            data.push(doc);
        }

        await testHarness.initialize({ opConfig });

        // first slice processed before window expires
        const results = await testHarness.run(data.slice(0, 1000));
        expect(results.length).toBe(0);

        // need to wait for window to expire
        await setTimeoutPromise(250)
            .then(() => testHarness.run(data.slice(1000, 2000)))
            .then((window) => {
                // records from previous chunk should be returned
                expect(window.length).toBe(1);
                expect(window[0].asArray().length).toBe(1000);
                expect(window[0].get(0).id).toBe(0);
                expect(window[0].get(999).id).toBe(999);
            });

        // need to wait for window to expire
        await setTimeoutPromise(250)
            .then(() => testHarness.run(data.slice(2000, 3000)))
            .then((window) => {
                // records from previous chunk should be returned
                expect(window.length).toBe(1);
                expect(window[0].asArray().length).toBe(1000);
                expect(window[0].get(0).id).toBe(1000);
            });

        // last window should return if no data in slice
        await setTimeoutPromise(250)
            .then(() => testHarness.run([]))
            .then((window) => {
                // records from previous chunk should be returned
                expect(window.length).toBe(1);
                expect(window[0].asArray().length).toBe(1000);
                expect(window[0].get(0).id).toBe(2000);
                expect(window[0].get(999).id).toBe(2999);
            });
    });
});

describe('window should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    let opConfig;

    beforeEach(() => {
        opConfig = {
            _op: 'window',
            window_length: 3000,
            window_type: 'sliding',
            sliding_window_interval: 2000,
            time_field: 'time',
            window_time_setting: 'event',
            event_window_expiration: 100
        };
    });

    it('use sliding windows and assign docs to correct windows ', async () => {
        const data = [];
        let time = 1556300016000;

        for (let i = 0; i < 20; i++) {
            time += 1000;
            const doc = {
                time: new Date(time).toISOString()
            };
            data.push(doc);
        }

        await testHarness.initialize({ opConfig });
        let results = await testHarness.run(data.slice(0, 10));

        expect(results.length).toBe(3);
        results.forEach(window => expect(window.asArray().length).toBe(4));

        results = await testHarness.run([]);
        expect(results.length).toBe(0);

        results = await testHarness.run(data.slice(10,));
        expect(results.length).toBe(5);
        results.forEach(window => expect(window.asArray().length).toBe(4));

        // all event windows should be expired by now
        await setTimeoutPromise(250)
            .then(() => testHarness.run([]))
            .then((window) => {
                expect(window.length).toBe(2);
                expect(window[0].asArray().length).toBe(4);
                expect(window[1].asArray().length).toBe(2);
            });

        results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });
});
