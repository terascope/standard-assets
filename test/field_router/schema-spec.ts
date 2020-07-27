import { TestContext } from '@terascope/job-components';
import Schema from '../../asset/src/field_router/schema';

describe('Field partitioner Schema', () => {
    const context = new TestContext('partition-by-fields');
    const schema = new Schema(context);

    afterAll(() => {
        context.apis.foundation.getSystemEvents().removeAllListeners();
    });

    describe('when validating the schema', () => {
        it('should throw an error if no fields specified', () => {
            expect(() => {
                schema.validate({
                    _op: 'field_router'
                });
            }).toThrowError(/Invalid `fields` option: must include at least one field to partition on./);
        });

        it('should throw an error if `fields` is not an array', () => {
            expect(() => {
                schema.validate({
                    _op: 'field_router',
                    fields: null
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
            expect(() => {
                schema.validate({
                    _op: 'field_router',
                    fields: undefined
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
            expect(() => {
                schema.validate({
                    _op: 'field_router',
                    fields: JSON.stringify('this ia a string')
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
            expect(() => {
                schema.validate({
                    _op: 'field_router',
                    fields: 42
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
        });
    });
});
