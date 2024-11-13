import { jest } from '@jest/globals';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { DataEntity } from '@terascope/job-components';

describe('debug_routes', () => {
    let harness: WorkerTestHarness;
    let spyOnStdout: jest.SpiedFunction<any>;

    beforeEach(() => {
        // @ts-expect-error
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
        const data = [
            DataEntity.make({ id: 1 }, { _key: '1', 'standard:route': 'a' }),
            DataEntity.make({ id: 2 }, { _key: '2', 'standard:route': 'b' }),
            DataEntity.make({ id: 3 }, { _key: '3', 'standard:route': 'a' }),
            DataEntity.make({ id: 4 }, { _key: '4', 'standard:route': 'c' }),
            DataEntity.make({ id: 5 }, { _key: '5', 'standard:route': 'a' }),
            DataEntity.make({ id: 6 }, { _key: '6', 'standard:route': 'b' }),
        ];

        harness = await makeTest();
        const results = await harness.runSlice(data);

        expect(results.length).toEqual(data.length);

        results.forEach((result, index) => {
            expect(result).toMatchObject(data[index]);
        });

        expect(spyOnStdout.mock.calls[0]).toEqual(['{ a: 3, b: 2, c: 1 }\n']);
    });
});
