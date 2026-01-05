import { pDelay } from '@terascope/core-utils';
import { RouteSenderAPI } from '@terascope/job-components';

export default class TestSenderApi implements RouteSenderAPI {
    sendArgs: any[] = [];
    routeArgs: any[] = [];
    configArgs: any[] = [];

    constructor(...args: any[]) {
        this.configArgs.push(...args);
    }

    async send(...args: any[]): Promise<number> {
        this.sendArgs.push(...args);
        await pDelay(Math.random() * 10);
        return Array.isArray(args[0]) ? args[0].length : -1;
    }

    async verify(...args: any[]): Promise<void> {
        this.routeArgs.push(...args);
        await pDelay(Math.random() * 10);
    }
}
