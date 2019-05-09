'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const DataWindow = require('../asset/__lib/data-window');
const Processor = require('../asset/dedup_by/processor.js');
const Schema = require('../asset/dedup_by/schema.js');

/* eslint-disable object-curly-newline */

describe('dedup should', () => {
    const opConfig = {
        _op: 'dedup',
        field: 'name'
    };

    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('dedup array of data', async () => {
        const keyedTestData = [
            { id: 1, name: 'roy' }, { id: 2, name: 'roy' },
            { id: 2, name: 'bob' }, { id: 2, name: 'roy' },
            { id: 3, name: 'bob' }, { id: 3, name: 'mel' }
        ];

        const results = await testHarness.run(keyedTestData);
        expect(results.length).toBe(3);
        expect(results).toEqual([{ id: 1, name: 'roy' }, { id: 2, name: 'bob' }, { id: 3, name: 'mel' }]);
    });

    it('dedup data windows', async () => {
        const keyedTestData = [
            DataWindow.make(1, [{ id: 1, name: 'roy' }]),
            DataWindow.make(2, [{ id: 2, name: 'roy' }, { id: 2, name: 'bob' }, { id: 2, name: 'roy' }]),
            DataWindow.make(3, [{ id: 3, name: 'bob' }, { id: 3, name: 'mel' }])
        ];

        const results = await testHarness.run(keyedTestData);

        expect(results.length).toBe(3);

        expect(results[0].getMetadata('_key')).toBe(1);
        expect(results[0].asArray()).toEqual([{ id: 1, name: 'roy' }]);

        expect(results[1].getMetadata('_key')).toBe(2);
        expect(results[1].asArray()).toEqual([{ id: 2, name: 'roy' }, { id: 2, name: 'bob' }]);

        expect(results[2].getMetadata('_key')).toBe(3);
        expect(results[2].asArray()).toEqual([{ id: 3, name: 'bob' }, { id: 3, name: 'mel' }]);
    });
});

describe('dedup_by', () => {
    const opConfig = {
        _op: 'dedup',
        field: 'name',
        adjust_time: true
    };

    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('should adjust first and last seen for an array of docs', async () => {
        const keyedTestData = [
            { id: 1, name: 'roy', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
            { id: 1, name: 'roy', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
            { id: 1, name: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
            { id: 2, name: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
            { id: 1, name: 'roy', first_seen: '2019-05-07T20:10:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
            { id: 2, name: 'bob', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
            { id: 3, name: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
            { id: 1, name: 'roy', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T19:02:00.000Z' },
            { id: 1, name: 'roy', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
            { id: 2, name: 'bob', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
            { id: 3, name: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
        ];

        const results = await testHarness.run(keyedTestData);

        expect(results.length).toBe(3);
        expect(results[0]).toEqual({ id: 1, name: 'roy', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' });
        expect(results[1]).toEqual({ id: 2, name: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' });
        expect(results[2]).toEqual({ id: 3, name: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' });
    });

    it('should adjust first and last seen for an array of data windows', async () => {
        const keyedTestData = [
            DataWindow.make(1, [
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 2, name: 'bob', first_seen: '2019-05-07T20:10:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
                { id: 2, name: 'bob', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T19:02:00.000Z' },
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:10:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
                { id: 2, name: 'bob', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T19:02:00.000Z' },
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                { id: 4, name: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                { id: 3, name: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 3, name: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                { id: 3, name: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
            ]),
            DataWindow.make(2, [
                { id: 2, name: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 2, name: 'bob', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                { id: 1, name: 'roy', first_seen: '2019-05-07T20:06:00.000Z', last_seen: '2019-05-07T20:06:00.000Z' },
                { id: 2, name: 'bob', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' }
            ]),
            DataWindow.make(3, [
                { id: 3, name: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 4, name: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                { id: 3, name: 'mel', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                { id: 3, name: 'mel', first_seen: '2019-05-07T20:03:00.000Z', last_seen: '2019-05-07T20:03:00.000Z' }
            ])
        ];

        const results = await testHarness.run(keyedTestData);

        expect(results.length).toBe(3);
        expect(results[0].asArray()).toEqual([
            { id: 1, name: 'roy', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
            { id: 2, name: 'bob', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
            { id: 4, name: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
            { id: 3, name: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' }
        ]);

        expect(results[1].asArray()).toEqual([
            { id: 2, name: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
            { id: 1, name: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:06:00.000Z' }
        ]);

        expect(results[2].asArray()).toEqual([
            { id: 3, name: 'mel', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
            { id: 4, name: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' }
        ]);
    });
});
