import 'jest-extended';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';

jest.setTimeout(10_000);

describe('stdout', () => {
    let harness: WorkerTestHarness;
    let logMsg: any;

    const log = jest.spyOn(console, 'log').mockImplementation((msg: any) => {
        logMsg = msg;
    });

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'stdout',
        };
        const opConfig = Object.assign({}, _op, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        // clears mock calls between each one
        log.mockClear();
        if (harness) {
            await harness.shutdown();
        }
    });

    afterAll(() => {
        // this removes mock
        log.mockReset();
    });

    it('should return the data once called', async () => {
        const test = await makeTest();
        const data = [{ hello: 'world' }, { some: 'stuff' }];
        const results = await test.runSlice(data);

        expect(results).toBeArrayOfSize(data.length);
        expect(results).toEqual(data);
    });

    it('should log the data', async () => {
        const test = await makeTest();
        const data = [{ hello: 'world' }, { some: 'stuff' }];

        await test.runSlice(data);

        expect(logMsg).toEqual(data);
    });

    it('should shorten the log', async () => {
        const test = await makeTest({ limit: 1 });
        const data = [{ hello: 'world' }, { some: 'stuff' }];

        await test.runSlice(data);

        expect(logMsg).toEqual(data.slice(0, 1));
    });
});
