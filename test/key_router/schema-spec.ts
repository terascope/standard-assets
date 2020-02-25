import { TestContext, newTestJobConfig } from '@terascope/job-components';
import Schema from '../../asset/src/key_router/schema';

describe('Key router Schema', () => {
    const context = new TestContext('key_router');
    const schema = new Schema(context);
    const jobConfig = newTestJobConfig({
        operations: [{
            _op: 'key_router',
            use: 2
        }]
    });

    afterAll(() => {
        context.apis.foundation.getSystemEvents().removeAllListeners();
    });

    describe('when validating the schema', () => {
        it('should throw if use and count are not used together', () => {
            expect(() => {
                const results = schema.validateJob(jobConfig);
            }).toThrowError();
        });
    });
});
