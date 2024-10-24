import { DataEntity } from '@terascope/utils';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { CopyMetadataFieldConfig } from '../../asset/src/copy_metadata_field/interfaces.js';

describe('copy_metadata_field', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    async function makeTest(config: Partial<CopyMetadataFieldConfig> = {}) {
        const baseConfig = {
            _op: 'copy_metadata_field',
            destination: '_key'
        };
        const opConfig = Object.assign({}, baseConfig, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    beforeEach(() => {
        data = [
            DataEntity.make(
                {
                    name: 'chilly',
                    age: 24
                },
                {
                    _key: 'qwerty',
                }
            ),
            DataEntity.make(
                {
                    name: 'willy',
                    age: 225
                },
                {
                    _key: 'asdfgh',
                }
            )
        ];
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should generate an empty result if no input data', async () => {
        const harness = await makeTest();
        const results = await harness.runSlice([]);

        expect(results.length).toBe(0);
    });

    it('by default, it should copy the metadata _key to the _key property on the doc', async () => {
        const destination = 'testField';
        const harness = await makeTest({ destination });
        const results = await harness.runSlice(data);

        results.forEach((result) => {
            expect(result[destination]).toEqual(result.getMetadata('_key'));
        });
    });

    it('it should copy any metadata key specified', async () => {
        const destination = 'testTime';
        const meta_key = '_createTime';

        const harness = await makeTest({ destination, meta_key });
        const results = await harness.runSlice(data);

        results.forEach((result) => {
            expect(result[destination]).toBeNumber();
        });
    });
});
