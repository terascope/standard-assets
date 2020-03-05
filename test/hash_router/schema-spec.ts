import { TestContext } from '@terascope/job-components';
import Schema from '../../asset/src/hash_router/schema';

describe('Hash partitioner Schema', () => {
    const context = new TestContext('partition-by-hash');
    const schema = new Schema(context);

    afterAll(() => {
        context.apis.foundation.getSystemEvents().removeAllListeners();
    });

    describe('when validating the schema', () => {
        it('should throw an error if `fields` is not an array', () => {
            expect(() => {
                schema.validate({
                    _op: 'hash_router',
                    fields: null
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
            expect(() => {
                schema.validate({
                    _op: 'hash_router',
                    fields: undefined
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
            expect(() => {
                schema.validate({
                    _op: 'hash_router',
                    fields: JSON.stringify('this ia a string')
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
            expect(() => {
                schema.validate({
                    _op: 'hash_router',
                    fields: 42
                });
            }).toThrowError(/Invalid `fields` option: must be an array./);
        });
    });
});
