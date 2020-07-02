import {
    BatchProcessor,
    WorkerContext,
    ExecutionConfig,
    RouteSenderAPI,
    APIFactoryRegistry
} from '@terascope/job-components';
import {
    chunk, TSError, DataEntity, isEmpty, pMap, AnyObject, isNil
} from '@terascope/utils';
import {
    RouteSenderConfig, RouteDict, RoutingExectuion, Endpoint
} from './interfaces';

interface SenderExecution {
    client: RouteSenderAPI;
    data: DataEntity[];
}

type SenderFactoryAPI = APIFactoryRegistry<RouteSenderAPI, AnyObject>

export type SenderFn = (
    fn: (msg: any) => DataEntity
) => (msg: any) => void

export default class RoutedSender extends BatchProcessor<RouteSenderConfig> {
    limit: number;
    routeDict: RouteDict = new Map();
    routingExectuion: RoutingExectuion = new Map();
    concurrency: number;
    api!: SenderFactoryAPI;
    tryFn: SenderFn;

    constructor(context: WorkerContext, opConfig: RouteSenderConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        const { routing, size, concurrency } = opConfig;
        this.limit = size;
        this.concurrency = concurrency;

        if (isEmpty(routing)) throw new TSError('Parameter routing must not be an empty object');

        const keysets = Object.keys(routing);

        if (keysets.includes('*') && keysets.includes('**')) throw new TSError('routing cannot specify "*" and "**"');

        for (const keyset of keysets) {
            const config = Object.assign({}, this.opConfig, { connection: routing[keyset] });
            const keys = keyset.split(',');

            for (const key of keys) {
                this.routeDict.set(key, { ...config, _key: key });
            }
        }

        this.tryFn = this.tryRecord.bind(this) as SenderFn;
    }

    async initialize(): Promise<void> {
        super.initialize();
        this.api = await this.createAPI(this.opConfig.api_name);
    }

    private async createRoute(route: string) {
        const config = this.routeDict.get(route);
        if (isNil(config)) throw new Error(`Could not get config for route ${route}, please verify that this is in the routing`);

        let client = this.api.get(config.connection);

        if (isNil(client)) {
            client = await this.api.create(
                config.connection,
                {
                    ...config,
                    tryFn: this.tryFn,
                    logger: this.logger
                }
            );
        }

        this.routingExectuion.set(route, { client, data: [] });
    }

    private formatRecords({ client, data }: SenderExecution) {
        if (data.length === 0) return [];
        return chunk(data, this.limit)
            .map((chunkedData) => ({ client, data: chunkedData }));
    }

    async routeToDestinations(batch: DataEntity[]): Promise<void> {
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

                await routeConfig.client.verify(route);

                routeConfig.data.push(record);
            } else {
                let error: TSError;

                if (route == null) {
                    error = new TSError('No route was specified in record metadata');
                } else {
                    error = new TSError(`Invalid connection route: ${route} was not found in routing`);
                }

                this.rejectRecord(record, error);
            }
        }

        const chunkedSegments: SenderExecution[] = [];

        for (const execution of this.routingExectuion.values()) {
            chunkedSegments.push(...this.formatRecords(execution));
        }

        await pMap(
            chunkedSegments,
            async ({ client, data }) => {
                if (data.length === 0) return true;
                return client.send(data);
            },
            { concurrency: this.concurrency }
        );

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
