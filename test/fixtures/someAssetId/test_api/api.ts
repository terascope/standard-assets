import { APIFactory, RouteSenderAPI } from '@terascope/job-components';
import TestSender from './test_sender.js';

export default class TestApi extends APIFactory<RouteSenderAPI, Record<string, any>> {
    async create(
        name: string, config: Record<string, any>
    ): Promise<{ client: RouteSenderAPI; config: Record<string, any> }> {
        const client = new TestSender(name, config);
        return { client, config };
    }

    async remove(): Promise<void> {}
}
