import {
    BatchProcessor,
    WorkerContext,
    ExecutionConfig,
    RouteSenderAPI,
    APIFactoryRegistry
} from '@terascope/job-components';
import {
    TSError, DataEntity, isEmpty, AnyObject
} from '@terascope/utils';
import { RoutedSender } from '@terascope/standard-asset-apis';
import {
    RouteSenderConfig
} from './interfaces';

type SenderFactoryAPI = APIFactoryRegistry<RouteSenderAPI, AnyObject>

export type SenderFn = (
    fn: (msg: any) => DataEntity
) => (msg: any) => void

export default class RoutedSenderProcessor extends BatchProcessor<RouteSenderConfig> {
    routedSender: RoutedSender;
    api!: SenderFactoryAPI;
    tryFn: SenderFn;

    constructor(context: WorkerContext, opConfig: RouteSenderConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        const { routing, size, concurrency } = opConfig;

        if (isEmpty(routing)) throw new TSError('Parameter routing must not be an empty object');
        this.tryFn = this.tryRecord.bind(this) as SenderFn;

        this.routedSender = new RoutedSender(routing, {
            batchSize: size,
            concurrencyPerStorage: concurrency,
            createRouteSenderAPI: this.createRouteSenderAPI.bind(this),
            rejectRecord: this.rejectRecord.bind(this),
        });
    }

    async initialize(): Promise<void> {
        await super.initialize();
        this.api = await this.createAPI(this.opConfig.api_name);
    }

    onSliceFailure(): void {
        this.routedSender.clearBatches();
    }

    private async createRouteSenderAPI(route: string, connection: string) {
        let client = this.api.get(route);

        if (client == null) {
            client = await this.api.create(
                route,
                {
                    ...this.opConfig,
                    connection,
                    tryFn: this.tryFn,
                    logger: this.logger
                }
            );
        }

        return client;
    }

    async onBatch(batch: DataEntity[]): Promise<DataEntity[]> {
        await this.routedSender.route(batch);
        await this.routedSender.send();
        return batch;
    }
}
