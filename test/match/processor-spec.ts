import path from 'path';
import { DataEntity, AnyObject } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('match phase', () => {
    let harness: WorkerTestHarness;

    const testAssetPath = path.join(__dirname, '..', './assets');
    const assetName = 'someAssetId';

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'match',
            plugins: ['someAssetId:plugins'],
            rules: [`${testAssetPath}/${assetName}:matchRules.txt`],
            types: { _created: 'date' }
        };
        const opConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('can return matching documents', async () => {
        const data = DataEntity.makeArray([
            { some: 'data', bytes: 1200 },
            { some: 'data', bytes: 200 },
            { some: 'other', bytes: 1200 },
            { other: 'xabcd' },
            { _created: '2018-12-16T15:16:09.076Z' }
        ]);
        const test = await makeTest();
        const results = await test.runSlice(data);

        expect(results.length).toEqual(3);
    });
});
