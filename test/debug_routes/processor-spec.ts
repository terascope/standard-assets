import { jest } from '@jest/globals';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DataEntity } from '@terascope/job-components';

describe('debug_routes', () => {
    let harness: WorkerTestHarness;
    let spyOnStdout: jest.SpiedFunction<any>;
    let data: DataEntity[] = [];

    beforeEach(() => {
        //@ts-expect-error
        spyOnStdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    });

    async function makeTest() {
        const baseConfig = {
            _op: 'debug_routes',
        };
        const opConfig = Object.assign({}, baseConfig);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) {
            await harness.shutdown();
        }
        spyOnStdout.mockRestore();
    });


    it('should write to stdout and return all records', async () => {
        harness = await makeTest();
        const results = await harness.runSlice(data)

        expect(results.length).toEqual(data.length);

        results.forEach((result, index) => {
            expect(result).toMatchObject(data[index])
        });

        expect(spyOnStdout.mock.calls[0]).toEqual(["{ a: 3, b: 2, c: 1 }\n"])
    });
});
