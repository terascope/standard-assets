import {
    MapProcessor, DataEntity, WorkerContext, OpConfig, ExecutionConfig
} from '@terascope/job-components';
import { DateRouter, DateRouterConfig } from '@terascope/standard-asset-apis';

export default class DateRouterProcessor extends MapProcessor<DateRouterConfig> {
    router: DateRouter;

    constructor(
        context: WorkerContext,
        opConfig: DateRouterConfig & OpConfig,
        exConfig: ExecutionConfig
    ) {
        super(context, opConfig, exConfig);
        this.router = new DateRouter(opConfig);
    }

    map(record: DataEntity): DataEntity {
        return this.tryRecord<DataEntity, DataEntity>((doc) => {
            const route = this.router.lookup(doc);
            doc.setMetadata(
                'standard:route',
                route
            );
            return doc;
        })(record) as DataEntity;
    }
}
