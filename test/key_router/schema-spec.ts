import { TestContext } from '@terascope/job-components';
import Schema from '../../asset/src/hash_router/schema';

describe('Key router Schema', () => {
    const context = new TestContext('key_router');
    const schema = new Schema(context);

    afterAll(() => {
        context.apis.foundation.getSystemEvents().removeAllListeners();
    });

    describe('when validating the schema', () => {
        it('should throw if use and count are not used together', () => {
            expect(() => {
                schema.validate({
                    _op: 'key_router',
                    use: 2
                });
            }).toThrowError();
        });
    });
});
