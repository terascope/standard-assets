import {
    DataEntity, pMap, debugLogger, getLast
} from '@terascope/utils';
import type { RouteSenderAPI } from '@terascope/job-components';
import EventEmitter, { once } from 'events';

type BatchOfRecords = readonly (DataEntity[])[];
export interface InitializedRoute {
    readonly sender: RouteSenderAPI;
    batches: BatchOfRecords;
}

export interface RoutedSenderOptions {
    batchSize: number;
    concurrencyAllStorage?: number;
    concurrencyPerStorage?: number;

    /**
     * This is used to create a sender apis for a particular and must be implemented
     * by a consumer of this class. This should NOT be called directly
    */
    createRouteSenderAPI(route: string, connection: string): Promise<RouteSenderAPI>;

    /**
     * This is called before the first call to standard:route
     * can be used to change the standard:route for storage routing
    */
    storageRouteHook?(record: DataEntity): void|Promise<void>;

    /**
     * This is called after the standard:route is pulled from the record
     * metadata and can be used to change the standard:route for data routing
     * (which is used within the route sender api implementations)
    */
    dataRouteHook?(record: DataEntity): void|Promise<void>;

    /**
      * This can be used to track the batches start
     */
    batchStartHook?(batchId: number, route: string, size: number): void|Promise<void>;

    /**
      * This can be used to track the batches end
     */
    batchEndHook?(batchId: number, route: string): void|Promise<void>;

    /**
      * When a reject is missing the required route or metadata to be processed
      * this method will be called with the record and error. This must be implemented
      * because this logic may vary depending on where/how it is being used
     */
    rejectRecord(record: DataEntity, error: unknown): void;
}

const logger = debugLogger('routed_sender');

/**
 * This is used to route records to multiple storage backends
 * and indices/topics/tables.
 *
 * Use this in conjunction with the routers
*/
export class RoutedSender {
    readonly routesDefinitions = new Map<string, string>();
    readonly initializingRoutes = new Set<string>();
    readonly verifiedRoutes = new Set<string>();
    readonly initializedRoutes = new Map<string, InitializedRoute>();
    /**
     * This is used to notify when a async task is complement
     * and a resource that needs atomic access
    */
    readonly events = new EventEmitter();

    private _batchId = 0;

    batchSize: number;
    concurrencyAllStorage: number;
    concurrencyPerStorage: number;

    /**
     * This is used to create a sender apis for a particular and must be implemented
     * by a consumer of this class. This should NOT be called directly
    */
    createRouteSenderAPI: (route: string, connection: string) => Promise<RouteSenderAPI>;

    /**
     * This is called before the first call to standard:route
     * can be used to change the standard:route for storage routing
    */
    storageRouteHook?: (record: DataEntity) => void|Promise<void>;

    /**
     * This is called after the standard:route is pulled from the record
     * metadata and can be used to change the standard:route for data routing
     * (which is used within the route sender api implementations)
    */
    dataRouteHook?: (record: DataEntity) => void|Promise<void>;

    /**
     * This can be used to track the batches start
     */
    batchStartHook?: (batchId: number, route: string, size: number) => void|Promise<void>;

    /**
     * This can be used to track the batches end
     */
    batchEndHook?: (batchId: number, route: string) => void|Promise<void>;

    /**
     * When a reject is missing the required route or metadata to be processed
     * this method will be called with the record and error. This must be implemented
     * because this logic may vary depending on where/how it is being used
     */
    rejectRecord: (record: DataEntity, error: unknown) => void;

    constructor(
        routes: Record<string, string>,
        options: RoutedSenderOptions
    ) {
        this.batchSize = options.batchSize;
        this.concurrencyAllStorage = options.concurrencyAllStorage ?? Infinity;
        this.concurrencyPerStorage = options.concurrencyPerStorage ?? 10;
        this.createRouteSenderAPI = options.createRouteSenderAPI;
        this.dataRouteHook = options.dataRouteHook;
        this.storageRouteHook = options.storageRouteHook;
        this.batchStartHook = options.batchStartHook;
        this.batchEndHook = options.batchEndHook;
        this.rejectRecord = options.rejectRecord;

        if (this.batchSize <= 0) {
            throw new Error(`Expect batch size to be >0, got ${this.batchSize}`);
        }

        for (const [keyset, connection] of Object.entries(routes)) {
            const keys = keyset.split(',');

            for (const key of keys) {
                this.routesDefinitions.set(key.trim(), connection);
            }
        }

        this.events.setMaxListeners(this.routesDefinitions.size * 10);

        if (this.routesDefinitions.has('*') && this.routesDefinitions.has('**')) {
            throw new Error('routing cannot specify "*" and "**"');
        }
    }

    /**
     * This is called once per route for the lifetime of this instance.
     * This is used to create multiple sender apis
    */
    async initializeRoute(route: string): Promise<void> {
        if (this.initializedRoutes.has(route)) return;

        if (this.initializingRoutes.has(route)) {
            logger.debug(`Waiting for sender api to be created for route:${route}`);
            await once(this.events, route);
            if (!this.initializedRoutes.has(route)) {
                throw new Error(`Expected route "${route}" to have been initialized`);
            }
            logger.debug(`Done waiting for sender api to be created for route:${route}`);
            return;
        }

        this.initializingRoutes.add(route);
        try {
            const connection = this.routesDefinitions.get(route);
            if (!connection) {
                throw new Error(`Missing route definition for "${route}"`);
            }
            logger.info(`Creating sender api for route:${route}, connection:${connection}`);
            const sender = await this.createRouteSenderAPI(route, connection);
            this.initializedRoutes.set(route, { sender, batches: [] });
        } finally {
            this.initializingRoutes.delete(route);
            this.events.emit(route);
        }
    }

    /**
     * This routes a list of records to internal batch queues
    */
    async route(
        records: DataEntity[],
    ): Promise<void> {
        await pMap(records, async (record) => {
            this.storageRouteHook && await this.storageRouteHook(record);

            const route = record.getMetadata('standard:route');

            this.dataRouteHook && await this.dataRouteHook(record);

            // if we have route, then use it, else make a topic if allowed.
            // if not then check if a "*" is set, if not then use rejectRecord
            if (this.initializedRoutes.has(route)) {
                const routeConfig = this.initializedRoutes.get(route)!;
                addRecordToBatch(routeConfig, record, this.batchSize);
            } else if (this.routesDefinitions.has(route)) {
                await this.initializeRoute(route);

                const routeConfig = this.initializedRoutes.get(route)!;
                addRecordToBatch(routeConfig, record, this.batchSize);
            } else if (this.routesDefinitions.has('*')) {
                await this.initializeRoute('*');

                const routeConfig = this.initializedRoutes.get('*')!;
                addRecordToBatch(routeConfig, record, this.batchSize);
            } else if (this.routesDefinitions.has('**')) {
                await this.initializeRoute('**');

                const routeConfig = this.initializedRoutes.get('**')!;

                const dataRoute = record.getMetadata('standard:route');
                if (!dataRoute) {
                    this.rejectRecord(
                        record,
                        new Error('No data route was specified in record metadata')
                    );
                    return;
                }

                await this._verifyRoute(
                    routeConfig.sender,
                    // we need to use the data route here because
                    // this will allow us to create the correct resource
                    dataRoute
                );
                addRecordToBatch(routeConfig, record, this.batchSize);
            } else if (route == null) {
                this.rejectRecord(
                    record,
                    new Error('No route was specified in record metadata')
                );
            } else {
                this.rejectRecord(
                    record,
                    new Error(`Invalid connection route: ${route} was not found in routing`)
                );
            }
        }, {
            stopOnError: true,
            /**
             * We can set this to a fixed size which
             * prevent too many calls to initialize (which is the only async thing here really)
            */
            concurrency: this.routesDefinitions.size * 10,
        });
    }

    /**
     * This function ensures that the route is verified only once
     * and is mainly only needed for dynamically created routes since
     * some storage systems may require creating a resource before it
     * can be written to
    */
    private async _verifyRoute(sender: RouteSenderAPI, route: string): Promise<void> {
        if (this.verifiedRoutes.has(route)) return;
        // set this before calling verify since doing concurrency control is no longer needed
        this.verifiedRoutes.add(route);

        await sender.verify(route);
    }

    /**
     * A quick check to see if there are any queued records left
     * to be processed
    */
    get hasQueuedRecords(): boolean {
        for (const { batches } of this.initializedRoutes.values()) {
            for (const batch of batches) {
                if (batch.length) return true;
            }
        }
        return false;
    }

    /**
     * The total number of queued records across all routes
    */
    get queuedRecordCount(): number {
        let count = 0;
        for (const { batches } of this.initializedRoutes.values()) {
            for (const batch of batches) {
                count += batch.length;
            }
        }
        return count;
    }

    /**
     * Send the routed records to their destinations
     *
     * @todo improve concurrency so it won't double on already running queries
     *
     * @param minPerBatch this is inclusive minimum per batch of records, this
     *                    is useful for not sending batches with of records
     *                    with a small amount of records in within it
    */
    async send(
        minPerBatch = 0
    ): Promise<void> {
        await pMap(this.initializedRoutes.entries(), async ([route, routeConfig]) => {
            if (!routeConfig.batches.length) return;

            // this will prevent records from being added the current batch
            const { batches } = routeConfig;
            routeConfig.batches = [];

            await pMap(batches, async (batch) => {
                if (batch.length <= minPerBatch) {
                    batch.forEach((record) => {
                        addRecordToBatch(routeConfig, record, this.batchSize);
                    });
                    return;
                }

                const batchId = ++this._batchId;
                this.batchStartHook && await this.batchStartHook(batchId, route, batch.length);

                logger.info(`Sending ${batch.length} records to route ${route}`);

                await routeConfig.sender.send(batch);
                this.batchEndHook && await this.batchEndHook(batchId, route);
            }, {
                stopOnError: false,
                concurrency: this.concurrencyPerStorage
            });
        }, {
            stopOnError: false,
            concurrency: this.concurrencyAllStorage
        });
    }

    clear(): void {
        this.initializingRoutes.clear();
        this.initializedRoutes.clear();
        this.verifiedRoutes.clear();
        this._batchId = 0;
    }

    clearBatches(): void {
        this.initializedRoutes.forEach((routeConfig) => {
            routeConfig.batches = [];
        });
    }
}

function addRecordToBatch(
    routeConfig: InitializedRoute,
    record: DataEntity,
    batchSize: number
): void {
    if (!routeConfig.batches.length) {
        routeConfig.batches = routeConfig.batches.concat([[]]);
    }

    let currentBatch = getLast(routeConfig.batches)!;

    if (currentBatch.length >= batchSize) {
        currentBatch = [];
        routeConfig.batches = routeConfig.batches.concat([currentBatch]);
    }

    currentBatch.push(record);
}
