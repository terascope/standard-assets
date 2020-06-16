import { OperationAPI, RouteSenderAPI } from '@terascope/job-components';
import TestSender from './test_sender';

export default class TestApi extends OperationAPI {
    async createAPI(...args: any[]): Promise<RouteSenderAPI> {
        return new TestSender(...args);
    }
}
