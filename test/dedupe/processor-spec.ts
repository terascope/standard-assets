/* eslint-disable object-curly-newline */

import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DataEntity, AnyObject } from '@terascope/job-components';
import DataWindow from '../../asset/src/__lib/data-window';

describe('dedupe', () => {
    let harness: WorkerTestHarness;
    const field = 'name';

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'dedupe',
            field
        };
        const opConfig = Object.assign({}, _op, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should generate an empty result if no input data', async () => {
        const test = await makeTest();
        const results = await test.runSlice([]);
        expect(results).toBeArrayOfSize(0);
    });

    it('should remove duplicates in an array of data', async () => {
        const keyedTestData = [
            { id: 1, [field]: 'roy' },
            { id: 2, [field]: 'roy' },
            { id: 2, [field]: 'bob' },
            { id: 2, [field]: 'roy' },
            { id: 3, [field]: 'bob' },
            { id: 3, [field]: 'mel' }
        ];

        const test = await makeTest();

        const results = await test.runSlice(keyedTestData);
        expect(results).toBeArrayOfSize(3);
        expect(results).toEqual([
            { id: 1, [field]: 'roy' },
            { id: 2, [field]: 'bob' },
            { id: 3, [field]: 'mel' }
        ]);
    });

    it('should should remove duplicates in data windows using the metadata key', async () => {
        const keyedTestData = [
            DataWindow.make(1, [DataEntity.make({ id: 1, [field]: 'roy' }, { _key: 'roy' })]),
            DataWindow.make(2, [
                DataEntity.make({ id: 2, [field]: 'roy' }, { _key: 'roy' }),
                DataEntity.make({ id: 2, [field]: 'bob' }, { _key: 'bob' }),
                DataEntity.make({ id: 2, [field]: 'roy' }, { _key: 'roy' })]),
            DataWindow.make(3, [
                DataEntity.make({ id: 3, [field]: 'bob' }, { _key: 'bob' }),
                DataEntity.make({ id: 3, [field]: 'mel' }, { _key: 'mel' })
            ])
        ];

        const test = await makeTest({ field: undefined });

        const results = await test.runSlice(keyedTestData) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        expect(results[0].getMetadata('_key')).toBe(1);
        expect(results[0].asArray()).toEqual([{ id: 1, [field]: 'roy' }]);

        expect(results[1].getMetadata('_key')).toBe(2);
        expect(results[1].asArray()).toEqual([{ id: 2, [field]: 'roy' }, { id: 2, [field]: 'bob' }]);

        expect(results[2].getMetadata('_key')).toBe(3);
        expect(results[2].asArray()).toEqual([{ id: 3, [field]: 'bob' }, { id: 3, [field]: 'mel' }]);
    });

    it('dedupe data windows', async () => {
        const keyedTestData = [
            DataWindow.make(1, [{ id: 1, [field]: 'roy' }]),
            DataWindow.make(2, [{ id: 2, [field]: 'roy' }, { id: 2, [field]: 'bob' }, { id: 2, [field]: 'roy' }]),
            DataWindow.make(3, [{ id: 3, [field]: 'bob' }, { id: 3, [field]: 'mel' }])
        ];

        const test = await makeTest();

        const results = await test.runSlice(keyedTestData) as DataWindow[];

        expect(results).toBeArrayOfSize(3);

        expect(results[0].getMetadata('_key')).toBe(1);
        expect(results[0].asArray()).toEqual([{ id: 1, [field]: 'roy' }]);

        expect(results[1].getMetadata('_key')).toBe(2);
        expect(results[1].asArray()).toEqual([{ id: 2, [field]: 'roy' }, { id: 2, [field]: 'bob' }]);

        expect(results[2].getMetadata('_key')).toBe(3);
        expect(results[2].asArray()).toEqual([{ id: 3, [field]: 'bob' }, { id: 3, [field]: 'mel' }]);
    });

    describe('adjust_time', () => {
        const opConfig = {
            _op: 'dedupe',
            field: 'name',
            adjust_time: [
                { field: 'first_seen', preference: 'oldest' },
                { field: 'last_seen', preference: 'newest' }
            ]
        };

        it('should adjust first and last seen for an array of docs', async () => {
            const keyedTestData = [
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:10:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
                { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T19:02:00.000Z' },
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
            ];

            const test = await makeTest(opConfig);
            const results = await test.runSlice(keyedTestData);

            expect(results).toBeArrayOfSize(3);
            expect(results[0]).toEqual({ id: 1, [field]: 'roy', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' });
            expect(results[1]).toEqual({ id: 2, [field]: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' });
            expect(results[2]).toEqual({ id: 3, [field]: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' });
        });

        it('should adjust first and last seen for an array of data windows', async () => {
            const keyedTestData = [
                DataWindow.make(1, [
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:10:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
                    { id: 2, [field]: 'bob', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T19:02:00.000Z' },
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:10:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
                    { id: 2, [field]: 'bob', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T19:02:00.000Z' },
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                    { id: 4, [field]: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                ]),
                DataWindow.make(2, [
                    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:06:00.000Z', last_seen: '2019-05-07T20:06:00.000Z' },
                    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' }
                ]),
                DataWindow.make(3, [
                    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                    { id: 4, [field]: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
                    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:03:00.000Z', last_seen: '2019-05-07T20:03:00.000Z' }
                ])
            ];

            const test = await makeTest(opConfig);
            const results = await test.runSlice(keyedTestData) as DataWindow[];

            expect(results).toBeArrayOfSize(3);
            expect(results[0].asArray()).toEqual([
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
                { id: 2, [field]: 'bob', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
                { id: 4, [field]: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
                { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' }
            ]);

            expect(results[1].asArray()).toEqual([
                { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
                { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:06:00.000Z' }
            ]);

            expect(results[2].asArray()).toEqual([
                { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
                { id: 4, [field]: 'tim', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' }
            ]);
        });
    });
});
