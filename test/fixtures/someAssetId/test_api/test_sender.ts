import { RouteSenderAPI, pDelay } from '@terascope/job-components';

export default class TestSenderApi implements RouteSenderAPI {
    sendArgs: any[] = [];
    routeArgs: any[] = [];
    configArgs: any[] = [];

    constructor(...args: any[]) {
        this.configArgs.push(...args);
    }

    async send(...args: any[]): Promise<void> {
        this.sendArgs.push(...args);
        await pDelay(Math.random() * 10);
    }

    async verify(...args:any[]): Promise<void> {
        this.routeArgs.push(...args);
        await pDelay(Math.random() * 10);
    }
}
