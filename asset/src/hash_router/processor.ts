import {
    MapProcessor,
    DataEntity,
    WorkerContext,
    ExecutionConfig,
    OpConfig
} from '@terascope/job-components';
import { HashRouter, HashRouterConfig } from '@terascope/standard-asset-apis';

export default class HashRouterProcessor extends MapProcessor<HashRouterConfig & OpConfig> {
    router: HashRouter;

    constructor(
        context: WorkerContext,
        opConfig: HashRouterConfig & OpConfig,
        exConfig: ExecutionConfig
    ) {
        super(context, opConfig, exConfig);
        this.router = new HashRouter(opConfig);
    }

    map(record: DataEntity): DataEntity {
        record.setMetadata(
            'standard:route',
            this.router.lookup(record)
        );
        return record;
    }
}
