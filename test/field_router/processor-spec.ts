import { DataEntity } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('Field Router Processor', () => {
    let harness: WorkerTestHarness;
    let data: DataEntity[];

    async function makeTest(config: Partial<OpConfig> = {}) {
        const _op = {
            _op: 'field_router',
            fields: [
                'field2',
                'field1'
            ]
        };
        const opConfig: OpConfig = config ? Object.assign({}, _op, config) : _op;
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    beforeEach(() => {
        data = [
            DataEntity.make(
                {
                    date: '2020-01-17T19:21:52.159Z',
                    field1: 'val1',
                    field2: 'val2'
                }
            ),
            DataEntity.make(
                {
                    date: '2020-01-17T19:21:52.159Z',
                    field1: 'val/1',
                    field2: 'val/2'
                }
            ),
            DataEntity.make(
                {
                    date: '2020-01-17T19:21:52.159Z',
                    field1: 'val=1',
                    field2: 'val=2'
                }
            )
        ];
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('properly sanitizes routes with specified keys', async () => {
        harness = await makeTest();

        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('field2_val2-field1_val1');
        expect(slice2.getMetadata('standard:route')).toEqual('field2_val_2-field1_val_1');
        expect(slice3.getMetadata('standard:route')).toEqual('field2_val_2-field1_val_1');
    });

    it('can change field_delimiter', async () => {
        harness = await makeTest({ field_delimiter: '/' });

        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('field2_val2/field1_val1');
        expect(slice2.getMetadata('standard:route')).toEqual('field2_val_2/field1_val_1');
        expect(slice3.getMetadata('standard:route')).toEqual('field2_val_2/field1_val_1');
    });

    it('can change value_delimiter', async () => {
        harness = await makeTest({ value_delimiter: '&' });

        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('field2&val2-field1&val1');
        expect(slice2.getMetadata('standard:route')).toEqual('field2&val_2-field1&val_1');
        expect(slice3.getMetadata('standard:route')).toEqual('field2&val_2-field1&val_1');
    });
    it('includes field name when include_field_names is true', async () => {
        harness = await makeTest({ value_delimiter: '&', include_field_names: true });

        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('field2&val2-field1&val1');
        expect(slice2.getMetadata('standard:route')).toEqual('field2&val_2-field1&val_1');
        expect(slice3.getMetadata('standard:route')).toEqual('field2&val_2-field1&val_1');
    });
    it('does not include field name when include_field_names is false', async () => {
        harness = await makeTest({ include_field_names: false });

        const [slice1, slice2, slice3] = await harness.runSlice(data);

        expect(slice1.getMetadata('standard:route')).toEqual('val2-val1');
        expect(slice2.getMetadata('standard:route')).toEqual('val_2-val_1');
        expect(slice3.getMetadata('standard:route')).toEqual('val_2-val_1');
    });
});
