import { DataEntity } from '@terascope/core-utils';
import {
    MapProcessor, Context
} from '@terascope/job-components';
import { ExecutionConfig, OpConfig } from '@terascope/types';
import { FieldRouterConfig, FieldRouter } from '@terascope/standard-asset-apis';

export default class FieldRouterProcessor extends MapProcessor<FieldRouterConfig & OpConfig> {
    router: FieldRouter;

    constructor(
        context: Context,
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
