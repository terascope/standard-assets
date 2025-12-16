import {
    DataEntity, pMap, getLast,
    isInteger, Logger,
    formatAggregateError
} from '@terascope/core-utils';
import { RouteSenderAPI } from '@terascope/job-components';
import EventEmitter, { once } from 'node:events';

export type BatchOfRecords = readonly (DataEntity[])[];

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
    storageRouteHook?(record: DataEntity): void | Promise<void>;

    /**
     * This is called after the standard:route is pulled from the record
     * metadata and can be used to change the standard:route for data routing
     * (which is used within the route sender api implementations)
    */
    dataRouteHook?(record: DataEntity): void | Promise<void>;

    /**
      * This can be used to track the batches start
     */
    batchStartHook?(batchId: number, route: string, size: number): void | Promise<void>;

    /**
      * This can be used to track the batches end
     */
    batchEndHook?(batchId: number, route: string, affectedRows: number): void | Promise<void>;

    /**
      * When a reject is missing the required route or metadata to be processed
      * this method will be called with the record and error. This must be implemented
      * because this logic may vary depending on where/how it is being used
     */
    rejectRecord(record: DataEntity, error: unknown): void;
}

/**
 * This is used to route records to multiple storage backends
 * and indices/topics/tables.
 *
 * Use this in conjunction with the routers
*/
export class RoutedSender {
    readonly routesDefinitions = new Map<string, string>();

    readonly verifiedRoutes = new Set<string>();

    readonly initializingSender = new Set<string>();
    readonly senders = new Map<string, RouteSenderAPI>();
    readonly allBatches = new Map<string, BatchOfRecords>();

    /**
     * This is used to notify when a async task is complement
     * and a resource that needs atomic access
    */
    readonly events = new EventEmitter();

    private _batchId = 0;

    batchSize: number;
    concurrencyAllStorage: number;
    concurrencyPerStorage: number;
    logger: Logger;

    /**
     * This is used to create a sender apis for a particular and must be implemented
     * by a consumer of this class. This should NOT be called directly
    */
    createRouteSenderAPI: (route: string, connection: string) => Promise<RouteSenderAPI>;

    /**
     * This is called before the first call to standard:route
     * can be used to change the standard:route for storage routing
    */
    storageRouteHook?: (record: DataEntity) => void | Promise<void>;

    /**
     * This is called after the standard:route is pulled from the record
     * metadata and can be used to change the standard:route for data routing
     * (which is used within the route sender api implementations)
    */
    dataRouteHook?: (record: DataEntity) => void | Promise<void>;

    /**
     * This can be used to track the batches start
     */
    batchStartHook?: (batchId: number, route: string, size: number) => void | Promise<void>;

    /**
     * This can be used to track the batches end
     */
    batchEndHook?: (batchId: number, route: string, affectedRows: number) => void | Promise<void>;

    /**
     * When a reject is missing the required route or metadata to be processed
     * this method will be called with the record and error. This must be implemented
     * because this logic may vary depending on where/how it is being used
     */
    rejectRecord: (record: DataEntity, error: unknown) => void;
    constructor(
        routes: Record<string, string>,
        options: RoutedSenderOptions,
        logger: Logger,
    ) {
        this.logger = logger;
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

        if (this.routesDefinitions.has('*') && this.routesDefinitions.has('**')) {
            throw new Error('routing cannot specify "*" and "**"');
        }
    }

    async initialize() {
        // best to initialize the catch all route before anything else
        if (this.routesDefinitions.has('**')) {
            await this.initializeRoute('**');
        }
    }

    /**
     * This is called once per route for the lifetime of this instance.
     * This is used to create multiple sender apis
    */
    async initializeRoute(route: string): Promise<void> {
        if (this.senders.has(route) || this.initializingSender.has(route)) return;

        this.allBatches.set(route, []);
        this.initializingSender.add(route);

        try {
            const connection = this.routesDefinitions.get(route);
            if (!connection) {
                throw new Error(`Missing route definition for "${route}"`);
            }

            this.logger.info(`Creating sender api for route:${route}, connection:${connection}`);
            const sender = await this.createRouteSenderAPI(route, connection);
            this.senders.set(route, sender);
        } finally {
            this.initializingSender.delete(route);
            this.events.emit(route);
        }
    }

    private async _waitForSender(route: string) {
        if (this.initializingSender.has(route)) {
            this.logger.debug(`Waiting for sender api to be created for route:${route}`);
            await once(this.events, route);
            this.logger.debug(`Done waiting for sender api to be created for route:${route}`);
        }

        const sender = this.senders.get(route);
        if (!sender) {
            throw new Error(`Expected route "${route}" to have been initialized`);
        }
        return sender;
    }

    /**
     * This routes a list of records to internal batch queues
    */
    async route(
        records: Iterable<DataEntity>
    ): Promise<void> {
        await pMap(records, async (record) => {
            this.storageRouteHook && await this.storageRouteHook(record);

            const route = record.getMetadata('standard:route');

            this.dataRouteHook && await this.dataRouteHook(record);

            // if we have route, then use it, else make a topic if allowed.
            // if not then check if a "*" is set, if not then use rejectRecord
            if (this.routesDefinitions.has(route)) {
                await this.initializeRoute(route);

                const batches = this.allBatches.get(route)!;

                this.allBatches.set(
                    route,
                    addRecordToBatch(batches, record, this.batchSize)
                );
            } else if (this.routesDefinitions.has('*')) {
                await this.initializeRoute('*');

                const batches = this.allBatches.get('*')!;
                this.allBatches.set(
                    '*',
                    addRecordToBatch(batches, record, this.batchSize)
                );
            } else if (this.routesDefinitions.has('**')) {
                const dataRoute = record.getMetadata('standard:route');
                if (!dataRoute) {
                    this.rejectRecord(
                        record,
                        new Error('No data route was specified in record metadata')
                    );
                    return;
                }

                const sender = await this._waitForSender('**');

                await this._verifyRoute(
                    sender,
                    // we need to use the data route here because
                    // this will allow us to create the correct resource
                    dataRoute
                );

                const batches = this.allBatches.get('**')!;

                this.allBatches.set(
                    '**',
                    addRecordToBatch(batches, record, this.batchSize)
                );
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
        });
    }

    /**
     * This function ensures that the route is verified only once
     * and is mainly only needed for dynamically created routes since
     * some storage systems may require creating a resource before it
     * can be written to
    */
    private async _verifyRoute(sender: RouteSenderAPI, route: string): Promise<void> {
        if (sender.verify == null) return;

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
        for (const batches of this.allBatches.values()) {
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
        for (const batches of this.allBatches.values()) {
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
     *
     * @returns the number of affected records
    */
    async send(
        minPerBatch = 0
    ): Promise<number> {
        let affectedRows = 0;

        try {
            await pMap(this.allBatches.entries(), async ([route, batches]) => {
                if (!batches.length) return;

                this.allBatches.set(route, []);

                try {
                    await pMap(batches, async (batch) => {
                        if (batch.length <= minPerBatch) {
                            batch.forEach((record) => {
                                this.allBatches.set(
                                    route,
                                    addRecordToBatch(
                                        this.allBatches.get(route)!, record, this.batchSize
                                    )
                                );
                            });
                            return;
                        }

                        const batchId = ++this._batchId;
                        this.batchStartHook
                        && await this.batchStartHook(batchId, route, batch.length);

                        this.logger.debug(`Sending ${batch.length} records to route ${route}`);

                        const sender = this.senders.get(route);
                        if (!sender) throw new Error('No sender registered for route');

                        const result: unknown = await sender.send(batch);
                        let affectedBatchCount: number;
                        if (isInteger(result)) {
                            affectedBatchCount = result;
                        } else {
                            // we do this for backwards compatibility
                            affectedBatchCount = batch.length;
                        }
                        affectedRows += affectedBatchCount;

                        this.batchEndHook
                        && await this.batchEndHook(batchId, route, affectedBatchCount);
                    }, {
                        stopOnError: false,
                        concurrency: this.concurrencyPerStorage
                    });
                } catch (err) {
                    await formatAggregateError(err);
                }
            }, {
                stopOnError: false,
                concurrency: this.concurrencyAllStorage
            });
        } catch (err) {
            await formatAggregateError(err);
        }

        return affectedRows;
    }

    clear(): void {
        this.initializingSender.clear();
        this.senders.clear();
        this.allBatches.clear();
        this.verifiedRoutes.clear();
        this._batchId = 0;
    }

    clearBatches(): void {
        this.allBatches.clear();
    }
}

function addRecordToBatch(
    batches: BatchOfRecords,
    record: DataEntity,
    batchSize: number
): BatchOfRecords {
    if (!batches.length) {
        return batches.concat([[record]]);
    }

    const currentBatch = getLast(batches)!;

    if (currentBatch.length >= batchSize) {
        return batches.concat([[record]]);
    }

    currentBatch.push(record);
    return batches;
}
