import {
    MapProcessor, DataEntity, OpConfig, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import { FieldRouterConfig, FieldRouter } from '@terascope/standard-asset-apis';

export default class FieldRouterProcessor extends MapProcessor<FieldRouterConfig & OpConfig> {
    router: FieldRouter;

    constructor(
        context: WorkerContext,
        opConfig: FieldRouterConfig & OpConfig,
        exConfig: ExecutionConfig
    ) {
        super(context, opConfig, exConfig);
        this.router = new FieldRouter(opConfig);
    }

    map(record: DataEntity): DataEntity {
        record.setMetadata(
            'standard:route',
            this.router.lookup(record),
        );
        return record;
    }
}
