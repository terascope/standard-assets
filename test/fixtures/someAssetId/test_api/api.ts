import { APIFactory, RouteSenderAPI, AnyObject } from '@terascope/job-components';
import TestSender from './test_sender';

export default class TestApi extends APIFactory<RouteSenderAPI, AnyObject> {
    async create(
        name: string, config: AnyObject
    ): Promise<{ client: RouteSenderAPI, config: AnyObject }> {
        const client = new TestSender(name, config);
        return { client, config };
    }

    async remove(): Promise<void> {}
}
