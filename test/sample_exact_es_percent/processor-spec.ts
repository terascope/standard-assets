import { WorkerTestHarness } from 'teraslice-test-harness';
import { SampleExactESPercentConfig } from '../../asset/src/sample_exact_es_percent/interfaces.js';
import { debugLogger, pDelay, TestClientConfig } from '@terascope/job-components';
import { makeData } from '../test_helpers.js';

describe('sample_exact_es_percent', () => {
    let harness: WorkerTestHarness;
    const logger = debugLogger('test-logger');

    // Each harness will make a get request to the mock elasticsearch client on initialization, and
    // once every 'window_ms' the harness exists beyond that. Each request to the client will shift
    // off and return the first element in percentArr.
    // Each test should overwrite percentArr with a new array.
    let percentArr: Array<number | string> = [];

    const defaultClients: TestClientConfig[] = [
        {
            type: 'elasticsearch-next',
            endpoint: 'default',
            createClient: async () => ({
                client: {
                    get: () => {
                        return { _source: { percent: percentArr.shift() }, found: true };
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
        percentArr = [100];
        harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results).toEqual([]);
    });

    it('with initial percentage at 100%, should return all the data', async () => {
        percentArr = ['100'];
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('shuffles the data', async () => {
        percentArr = [100];
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        const outOfOrder = results.some((record, index) => {
            return record._key !== data[index]._key;
        });

        expect(outOfOrder).toBeTrue();
    });

    it('with initial percentage at 0%, should return none of the data', async () => {
        percentArr = [0];
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with initial percentage at 50%, should return half of all the data', async () => {
        percentArr = [50];
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(5);
    });

    it('with initial percentage at 100%, should return all data', async () => {
        percentArr = [100];
        const data = makeData(10);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(10);
    });

    it('with small data, and a low enough percentage, will return 0', async () => {
        percentArr = [25];
        const data = makeData(3);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(0);
    });

    it('with large datasets and 95%', async () => {
        percentArr = [95];
        const data = makeData(10000);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(9500);
    });

    it('with large datasets and 50%', async () => {
        percentArr = [50];
        const data = makeData(10000);
        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(5000);
    });

    it('updates percentage every window_ms', async () => {
        percentArr = [50, 0, 100];
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

    it('percentage can be number or string', async () => {
        percentArr = ['50', 0, '100'];
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
        // client will shift off and return first element of docArr[].
        // Each request will be tried 3 times, so 3 copies of any document that throws are required.
        let docArr: { found: boolean; _source: object }[] = [];
        const errorClients: TestClientConfig[] = [
            {
                type: 'elasticsearch-next',
                endpoint: 'default',
                createClient: async () => ({
                    client: {
                        get: () => {
                            return docArr.shift();
                        }
                    },
                    logger
                }),
            }
        ];

        it('should throw if initial request fails', async () => {
            const doc = { found: false };
            docArr = Array(3).fill(doc);
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: The document with id abc123 was '
                    + 'not found in index my-index of elasticsearch-next connection default.');
        });

        it('should throw if document not found', async () => {
            const doc = { found: false };
            docArr = Array(3).fill(doc);
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: The document with id abc123 was '
                    + 'not found in index my-index of elasticsearch-next connection default.');
        });

        it('should throw if percent string cannot be converted to a number', async () => {
            const doc = { found: true, _source: { percent: 'hi' } };
            docArr = Array(3).fill(doc);
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: Percent could not be converted '
                    + 'from a string to a number:_id: abc123, percent: hi');
        });

        it('should throw percent is not a string or number', async () => {
            const doc = { found: true, _source: { percent: {} } };
            docArr = Array(3).fill(doc);
            await expect(makeTest({ index: 'my-index', document_id: 'abc123' }, errorClients)).rejects
                .toThrow('SampleExactESPercentage failed to retrieve percentage from index my-index of '
                    + 'elasticsearch-next connection default: TSError: Expected percent to be of type '
                    + 'number or string, found Object. _id: abc123, '
                    + 'percent: [object Object]');
        });

        // TODO add tests for error conditions while in interval
    });
});
