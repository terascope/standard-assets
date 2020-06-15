import {
    getClient,
    BatchProcessor,
    DataEntity,
    WorkerContext,
    ExecutionConfig,
    AnyObject,
    TSError,
    isEmpty
} from '@terascope/job-components';
import { RouteSenderConfig } from './interfaces';

interface Endpoint {
    client: any;
    data: any[];
}

interface BulkContexts {
    [key: string]: Endpoint;
}

export default class RouteSender extends BatchProcessor<RouteSenderConfig> {
    limit: number;
    bulkContexts: BulkContexts = {};

    constructor(context: WorkerContext, opConfig: RouteSenderConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        const {
            connection_map: connectionMap,
            size
        } = opConfig;

        this.limit = size;
        this.bulkContexts = {};

        if (isEmpty(connectionMap)) throw new TSError('Parameter connection_map must not be an empty object');

        for (const keyset of Object.keys(connectionMap)) {
            // TODO: is this missing pertinent keys without rest of opConfig?
            const client = this._createClient({ connection: connectionMap[keyset] });
            const keys = keyset.split(',');

            for (const key of keys) {
                this.bulkContexts[key.toLowerCase()] = {
                    client,
                    // TODO: this is never cleaned up
                    data: []
                };
            }
        }
    }

    private _createClient(config: AnyObject = this.opConfig) {
        return getClient(this.context, config, 'elasticsearch');
    }

    async onBatch(data: DataEntity[]) {
        return data;
    }
}
