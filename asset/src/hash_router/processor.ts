import { DataEntity } from '@terascope/core-utils';
import { MapProcessor, Context } from '@terascope/job-components';
import { ExecutionConfig, OpConfig } from '@terascope/types';
import { HashRouter, HashRouterConfig } from '@terascope/standard-asset-apis';

export default class HashRouterProcessor extends MapProcessor<HashRouterConfig & OpConfig> {
    router: HashRouter;

    constructor(
        context: Context,
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
