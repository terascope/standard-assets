import { WorkerTestHarness } from 'teraslice-test-harness';
import { SampleExactESPercentConfig } from '../../asset/src/sample_exact_es_percent/interfaces.js';
import { debugLogger, pDelay, TestClientConfig } from '@terascope/job-components';

describe('sample_exact_es_percent', () => {
    let harness: WorkerTestHarness;
    const logger = debugLogger('test-logger');

    // Each harness will make a get request to the mock elasticsearch client on initialization, and
    // once every 'window_ms' the harness exists beyond that. Each request to the client will return
    // percentArr[i] then increment i for the next request. Update array when modifying tests.
    const percentArr = [100, 100, 100, 0, 50, 100, 25, 95, 50, 50, 0, 100];
    let i = 0;

    const defaultClients: TestClientConfig[] = [
        {
            type: 'elasticsearch-next',
            endpoint: 'default',
            createClient: async () => ({
                client: {
                    get: () => {
                        return { _source: { percent: percentArr[i++] }, found: true };
                    }
                },
                logger
            }),
        }
    ];

    async function makeTest(config: Partial<SampleExactESPercentConfig> = { index: 'my-index', document_id: 'abc123' }, clients = defaultClients) {
        const baseConfig = {
            _op: 'sample_exact_es_percent',
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig, { clients });

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('with initial percentage at 100%, should return empty array from empty array', async () => {
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results).toEqual([]);
    });

    it('with initial percentage at 100%, should return all the data', async () => {
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('shuffles the data', async () => {
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        const outOfOrder = results.some((record, index) => {
            return record._key !== data[index]._key;
        });

        expect(outOfOrder).toBeTrue();
    });

    it('with initial percentage at 0%, should return none of the data', async () => {
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with initial percentage at 50%, should return half of all the data', async () => {
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(5);
    });

    it('with initial percentage at 100%, should return all data', async () => {
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('with small data, and a low enough percentage, will return 0', async () => {
        const data = makeData(3);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with large datasets and 95%', async () => {
        const data = makeData(10000);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(9500);
    });

    it('with large datasets and 50%', async () => {
        const data = makeData(10000);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(5000);
    });

    it('updates percentage every window_ms', async () => {
        const data = makeData(10000);
        harness = await makeTest({ window_ms: 100, index: 'my-index', document_id: 'abc123' });
        const results1 = await harness.runSlice(data);
        await pDelay(100);
        const results2 = await harness.runSlice(data);
        await pDelay(100);
        const results3 = await harness.runSlice(data);

        expect(results1.length).toEqual(5000);
        expect(results2.length).toEqual(0);
        expect(results3.length).toEqual(10000);
    }, 30000);

    describe('-> _getNewPercentKept errors', () => {
        // client will return docArr[j] 3 times, once fore each retry
        let j = 0;
        const docArr = [{ found: false }, { found: false }, { found: true, _source: { percent: 'hi' } }, { found: true, _source: { percent: {} } }];
        const errorClients: TestClientConfig[] = [
            {
                type: 'elasticsearch-next',
                endpoint: 'default',
                createClient: async () => ({
                    client: {
                        get: () => {
                            const idx = j++ / 3;
                            return docArr[Math.floor(idx)];
                        }
                    },
                    logger
                }),
            }
        ];

        it('should throw if initial request fails', async () => {
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: The document with id abc123 was '
                    + 'not found in index my-index of elasticsearch-next connection default.');
        });

        it('should throw if document not found', async () => {
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: The document with id abc123 was '
                    + 'not found in index my-index of elasticsearch-next connection default.');
        });

        it('should throw if percent string cannot be converted to a number', async () => {
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: Percent could not be converted '
                    + 'from a string to a number:_id: abc123, percent: hi');
        });

        it('should throw percent is not a string or number', async () => {
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: Expected percent to be of type '
                    + 'number or string, found Object. _id: abc123, '
                    + 'percent: [object Object]');
        });

        // TODO add tests for error conditions while in interval
    });
});

interface FakeData {
    _key: number;
    name: string;
    age: string;
}

function makeData(n: number): FakeData[] {
    const bunchesOData = [];

    for (let i = 0; i < n; i++) {
        bunchesOData.push({
            _key: i,
            name: 'name',
            age: 'age'
        });
    }

    return bunchesOData;
}
