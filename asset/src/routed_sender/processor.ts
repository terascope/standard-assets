import {
    BatchProcessor,
    DataEntity,
    WorkerContext,
    ExecutionConfig,
    TSError,
    isEmpty,
    RouteSenderAPI
} from '@terascope/job-components';
import {
    RouteSenderConfig, RouteDict, RoutingExectuion, Endpoint
} from './interfaces';

export default class RoutedSender extends BatchProcessor<RouteSenderConfig> {
    limit: number;
    routeDict: RouteDict = new Map();
    routingExectuion: RoutingExectuion = new Map();

    constructor(context: WorkerContext, opConfig: RouteSenderConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        const { routing, size } = opConfig;

        this.limit = size;

        if (isEmpty(routing)) throw new TSError('Parameter routing must not be an empty object');

        const keysets = Object.keys(routing);

        if (keysets.includes('*') && keysets.includes('**')) throw new TSError('routing cannot specify "*" and "**"');

        for (const keyset of keysets) {
            const config = Object.assign({}, this.opConfig, { connection: routing[keyset] });
            const keys = keyset.split(',');

            for (const key of keys) {
                this.routeDict.set(key.toLowerCase(), config);
            }
        }
    }

    private async createRoute(route: string) {
        const { api_name } = this.opConfig;
        const config = this.routeDict.get(route);
        // we cannot cache this type of api becuase we need to call and get several types
        // @ts-expect-error
        const client: RouteSenderAPI = await this.context.apis.executionContext._apis[api_name]
            .instance.createAPI(config);
        this.routingExectuion.set(route, { client, data: [] });
        await client.verifyRoute(config);
    }

    async routeToDestinations(batch: DataEntity[]): Promise<void> {
        const senders = [];

        for (const record of batch) {
            const route = record.getMetadata('standard:route');
            // if we have route, then use it, else make a topic if allowed.
            // if not then check if a "*" is set, if not then use rejectRecord
            if (this.routingExectuion.has(route)) {
                const routeConfig = this.routingExectuion.get(route) as Endpoint;
                routeConfig.data.push(record);
            } else if (this.routeDict.has(route)) {
                await this.createRoute(route);

                const routeConfig = this.routingExectuion.get(route) as Endpoint;
                routeConfig.data.push(record);
            } else if (this.routeDict.has('*')) {
                if (!this.routingExectuion.has('*')) {
                    await this.createRoute('*');
                }
                const routeConfig = this.routingExectuion.get('*') as Endpoint;
                routeConfig.data.push(record);
            } else if (this.routeDict.has('**')) {
                if (!this.routingExectuion.has('**')) {
                    await this.createRoute('**');
                }

                const routeConfig = this.routingExectuion.get('**') as Endpoint;
                routeConfig.data.push(record);
            } else {
                let error: TSError;

                if (route == null) {
                    error = new TSError('No route was specified in record metadata');
                } else {
                    error = new TSError(`Invalid connection route: ${route} was not found on connector_map`);
                }

                this.rejectRecord(record, error);
            }
        }

        for (const [, { data, client }] of this.routingExectuion) {
            if (data.length > 0) {
                senders.push(client.send(data));
            }
        }

        await Promise.all(senders);

        this._cleanupRouteExecution();
    }

    private _cleanupRouteExecution() {
        for (const config of this.routingExectuion.values()) {
            config.data = [];
        }
    }

    async onBatch(batch: DataEntity[]): Promise<DataEntity[]> {
        await this.routeToDestinations(batch);

        return batch;
    }
}
