'use strict';

const _ = require('lodash');

const { DataEntity } = require('@terascope/job-components');
const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/sorted_bucket_accumulator/processor.js');
const Schema = require('../asset/sorted_bucket_accumulator/schema.js');

// We need to use DataEntities here in order to set keys.
const testData = [
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

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                empty_after: 0
            }
        });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('generate sorted results by id ascending', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);

        let next = 1;
        results.forEach((doc) => {
            expect(doc.id === next).toBe(true);
            next += 1;
        });
    });
});

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                order: 'desc',
                empty_after: 0
            }
        });
    });

    it('generate sorted results by id descending', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(3);

        let next = 3;
        results.forEach((doc) => {
            expect(doc.id === next).toBe(true);
            next -= 1;
        });
    });
});

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                order: 'desc',
                empty_after: 3,
                batch_size: 1
            }
        });
    });

    it('generate sorted results by id descending after 3 empty slices - single key', async () => {
        // Should get no results after the first 3 slices.
        const results = await testHarness.run(testData);
        expect(results.length).toBe(0);

        const results2 = await testHarness.run([]);
        expect(results2.length).toBe(0);

        const results3 = await testHarness.run([]);
        expect(results3.length).toBe(0);

        // After the 3rd empty slice we should see results.
        // batch_size is 1 so we expect 1 record per slice
        const results4 = await testHarness.run([]);
        expect(results4.length).toBe(1);
        expect(results4[0].id).toBe(3);

        const results5 = await testHarness.run([]);
        expect(results5.length).toBe(1);
        expect(results5[0].id).toBe(2);

        const results6 = await testHarness.run([]);
        expect(results6.length).toBe(1);
        expect(results6[0].id).toBe(1);

        // Accumulator should be empty.
        const results7 = await testHarness.run([]);
        expect(results7.length).toBe(0);
    });
});

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    const localData = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                order: 'asc',
                empty_after: 3,
                batch_size: 100
            }
        });

        for (let i = 0; i < 300; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 3
            }));
        }
    });

    it('generate sorted results by id after 3 empty slices - many keys', async () => {
        // Should get no results after the first 3 slices.
        const results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        const results2 = await testHarness.run([]);
        expect(results2.length).toBe(0);

        const results3 = await testHarness.run([]);
        expect(results3.length).toBe(0);

        // After the 3rd empty slice we should see results.
        // batch_size is 100 so we expect 100 records per slice
        const results4 = await testHarness.run([]);
        expect(results4.length).toBe(100);

        // We should get 3 slices of data each for a different key
        // and see all the ids increase. Since it dumps each bucket entirely
        // before proceeding to the next we should see each 100 record
        // slice for a single bucket.
        let priorID = 0;
        const phase1Key = DataEntity.getMetadata(results4[0], '_key');

        results4.forEach((record) => {
            expect(DataEntity.getMetadata(record, '_key')).toBe(phase1Key);

            expect(record.id).not.toBeLessThan(priorID);
            priorID = record.id;
        });

        const results5 = await testHarness.run([]);
        expect(results5.length).toBe(100);

        // We should see all the ids increase
        priorID = 0;
        const phase2Key = DataEntity.getMetadata(results5[0], '_key');
        results5.forEach((record) => {
            expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase1Key);
            expect(DataEntity.getMetadata(record, '_key')).toBe(phase2Key);

            expect(record.id).not.toBeLessThan(priorID);
            priorID = record.id;
        });

        const results6 = await testHarness.run([]);
        expect(results6.length).toBe(100);

        // We should see all the ids increase
        priorID = 0;
        const phase3Key = DataEntity.getMetadata(results6[0], '_key');
        results6.forEach((record) => {
            expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase1Key);
            expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase2Key);
            expect(DataEntity.getMetadata(record, '_key')).toBe(phase3Key);

            expect(record.id).not.toBeLessThan(priorID);
            priorID = record.id;
        });
    });
});

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    const localData = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                order: 'asc',
                empty_after: 3,
                batch_size: 100
            }
        });

        // This generates 225 records for 3 different keys so each
        // should end up with 75 records.
        for (let i = 0; i < 225; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 3
            }));
        }
    });

    it('generate sorted results by id after 3 empty slices - many keys, spanning slices', async () => {
        // Should get no results after the first 3 slices.
        const results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        const results2 = await testHarness.run([]);
        expect(results2.length).toBe(0);

        const results3 = await testHarness.run([]);
        expect(results3.length).toBe(0);

        // We should get 3 slices of data.
        // First slice should have 75 records for one key then
        // 25 for the next.
        const results4 = await testHarness.run([]);
        expect(results4.length).toBe(100);

        let priorID = 0;
        const phase1Key = DataEntity.getMetadata(results4[0], '_key');
        let phase2Key;
        let count = 0;
        results4.forEach((record) => {
            if (count < 75) {
                expect(DataEntity.getMetadata(record, '_key')).toBe(phase1Key);
            } else if (count === 75) {
                phase2Key = DataEntity.getMetadata(results4[count], '_key');
                priorID = 0;
            } else {
                expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase1Key);
                expect(DataEntity.getMetadata(record, '_key')).toBe(phase2Key);
            }

            expect(record.id).not.toBeLessThan(priorID);
            priorID = record.id;
            count++;
        });

        // Next slice should have 50 for the second key in slice 1 and
        // 50 for the remaining key.
        const results5 = await testHarness.run([]);
        expect(results5.length).toBe(100);
        let phase3Key;

        count = 0;
        results5.forEach((record) => {
            if (count < 50) {
                expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase1Key);
                expect(DataEntity.getMetadata(record, '_key')).toBe(phase2Key);
            } else if (count === 50) {
                phase3Key = DataEntity.getMetadata(results5[count], '_key');
                priorID = 0;
            } else {
                expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase2Key);
                expect(DataEntity.getMetadata(record, '_key')).toBe(phase3Key);
            }

            expect(record.id).not.toBeLessThan(priorID);
            priorID = record.id;
            count++;
        });

        // The final slice should only have 25 records, all for the phase3key
        const results6 = await testHarness.run([]);
        expect(results6.length).toBe(25);

        results6.forEach((record) => {
            expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase1Key);
            expect(DataEntity.getMetadata(record, '_key')).not.toBe(phase2Key);
            expect(DataEntity.getMetadata(record, '_key')).toBe(phase3Key);

            expect(record.id).not.toBeLessThan(priorID);
            priorID = record.id;
        });

        // We've read all the data so the next result should be empty again.
        const results7 = await testHarness.run([]);
        expect(results7.length).toBe(0);
    });
});

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    const localData = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                empty_after: 3,
                keyed_batch: true,
                sort_using: 'node'
            }
        });

        // This generates 300 records for 3 different keys so each
        // should end up with 100 records.
        for (let i = 0; i < 300; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 3
            }));
        }
    });

    it('return a properly sorted keyed batch using node.js array sort', async () => {
        // Should get no results after the first 3 slices.
        const results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        const results2 = await testHarness.run([]);
        expect(results2.length).toBe(0);

        const results3 = await testHarness.run([]);
        expect(results3.length).toBe(0);

        // We should get an array with one object which has 3 keys
        // and each key should have 100 results
        const results4 = await testHarness.run([]);
        expect(results4.length).toBe(1);

        const records = results4[0];
        const keys = _.keys(results4[0]);
        expect(keys.length).toBe(3);

        keys.forEach((key) => {
            const data = records[key];
            expect(data.length).toBe(100);

            let priorID = 0;
            data.forEach((record) => {
                expect(record.id).not.toBeLessThan(priorID);
                priorID = record.id;
            });
        });

        // Next result should be empty again.
        const results5 = await testHarness.run([]);
        expect(results5.length).toBe(0);
    });
});

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    const localData = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                empty_after: 3,
                keyed_batch: true,
                sort_using: 'timsort'
            }
        });

        // This generates 300 records for 3 different keys so each
        // should end up with 100 records.
        for (let i = 0; i < 300; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 3
            }));
        }
    });

    it('return a properly sorted keyed batch using timsort', async () => {
        // Should get no results after the first 3 slices.
        const results = await testHarness.run(localData);
        expect(results.length).toBe(0);

        const results2 = await testHarness.run([]);
        expect(results2.length).toBe(0);

        const results3 = await testHarness.run([]);
        expect(results3.length).toBe(0);

        // We should get an array with one object which has 3 keys
        // and each key should have 100 results
        const results4 = await testHarness.run([]);
        expect(results4.length).toBe(1);

        const records = results4[0];
        const keys = _.keys(results4[0]);
        expect(keys.length).toBe(3);

        keys.forEach((key) => {
            const data = records[key];
            expect(data.length).toBe(100);

            let priorID = 0;
            data.forEach((record) => {
                expect(record.id).not.toBeLessThan(priorID);
                priorID = record.id;
            });
        });

        // Next result should be empty again.
        const results5 = await testHarness.run([]);
        expect(results5.length).toBe(0);
    });
});

describe('sorted_bucket_accumulator should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });
    const localData = [];

    beforeAll(async () => {
        await testHarness.initialize({
            opConfig: {
                _op: 'sorted_bucket_accumulator',
                sort_field: 'id',
                empty_after: 0,
                sort_using: 'node',
                strip_metadata: true
            }
        });

        // This generates 300 records for 3 different keys so each
        // should end up with 100 records.
        for (let i = 0; i < 30; i++) {
            localData.push(DataEntity.make({
                id: Math.floor(Math.random() * 1000)
            }, {
                _key: i % 3
            }));
        }
    });

    it('properly restore keys when metadata is stripped', async () => {
        // Should get no results after the first 3 slices.
        const results = await testHarness.run(localData);
        expect(results.length).toBe(30);

        let currentKey = DataEntity.getMetadata(results[0], '_key');
        let i = 0;
        results.forEach((record) => {
            if (i % 10 === 0) {
                currentKey = DataEntity.getMetadata(record, '_key');
            }

            expect(DataEntity.getMetadata(record, '_key')).toBe(currentKey);
            i++;
        });
    });
});
