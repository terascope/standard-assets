import { DataEntity, pMap } from '@terascope/utils';
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
     * This called before the first call to standard:route
     * can be used to change te storage route for data routing
     * which is implemented in the sender api
    */
    storageRouteHook?(record: DataEntity): void|Promise<void>;

    /**
      * This called after the standard:route is pulled from
      * can be used to change te storage route for data routing
      * which is implemented in the sender api
     */
    dataRouteHook?(record: DataEntity): void|Promise<void>;

    /**
      * This can be used to track the batches start
     */
    batchStartHook?(route: string, size: number): void|Promise<void>;

    /**
      * This can be used to track the batches end
     */
    batchEndHook?(route: string): void|Promise<void>;

    /**
      * When a reject is missing the required route or metadata to be processed
      * this method will be called with the record and error. This must be implemented
      * because this logic may vary depending on where/how it is being used
     */
    rejectRecord(record: DataEntity, error: unknown): void;
}

/**
 * This is used to route record to multiple destinations
*/
export class RoutedSender {
    readonly routesDefinitions = new Map<string, string>();
    readonly initializingRoutes = new Set<string>();
    readonly initializedRoutes = new Map<string, InitializedRoute>();
    readonly events = new EventEmitter();

    batchSize: number;
    concurrencyAllStorage: number;
    concurrencyPerStorage: number;

    /**
     * This is used to create a sender apis for a particular and must be implemented
     * by a consumer of this class. This should NOT be called directly
    */
    createRouteSenderAPI: (route: string, connection: string) => Promise<RouteSenderAPI>;

    /**
      * This called before the first call to standard:route
      * can be used to change te storage route for data routing
      * which is implemented in the sender api
     */
    storageRouteHook?: (record: DataEntity) => void|Promise<void>;

    /**
     * This called after the standard:route is pulled from
     * can be used to change te storage route for data routing
     * which is implemented in the sender api
     */
    dataRouteHook?: (record: DataEntity) => void|Promise<void>;

    /**
     * This can be used to track the batches start
     */
    batchStartHook?: (route: string, size: number) => void|Promise<void>;

    /**
     * This can be used to track the batches end
     */
    batchEndHook?: (route: string) => void|Promise<void>;

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

        this.events.setMaxListeners(this.batchSize);

        for (const [keyset, connection] of Object.entries(routes)) {
            const keys = keyset.split(',');

            for (const key of keys) {
                this.routesDefinitions.set(key, connection);
            }
        }

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

        if (!this.initializingRoutes.has(route)) {
            await once(this.events, route);
            if (!this.initializedRoutes.has(route)) {
                throw new Error(`Expected route "${route}" to have been initialized`);
            }
        }

        this.initializingRoutes.add(route);
        try {
            const connection = this.routesDefinitions.get(route);
            if (!connection) {
                throw new Error(`Missing route definition for "${route}"`);
            }
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

                await routeConfig.sender.verify(route);

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
            stopOnError: false,
        });
    }

    /**
     * Send the routed records to their destinations
     *
     * @todo improve concurrency so it won't double on already running queries
    */
    async send(): Promise<void> {
        await pMap(this.initializedRoutes.entries(), async ([route, routeConfig]) => {
            if (!routeConfig.batches.length) return;

            // this will prevent records from being added the current batch
            const batches = routeConfig.batches.map((batch) => batch.slice());
            routeConfig.batches = [];

            await pMap(batches, async (batch) => {
                this.batchStartHook && await this.batchStartHook(route, batch.length);
                await routeConfig.sender.send(batch);
                this.batchEndHook && this.batchEndHook(route);
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
    _batchSize: number
): void {
    if (!routeConfig.batches.length) {
        routeConfig.batches = routeConfig.batches.concat([]);
    }
    const lastIndex = routeConfig.batches.length - 1;
    routeConfig.batches[lastIndex].push(record);
}
