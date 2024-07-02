import {
    MapProcessor, DataEntity, Context
} from '@terascope/job-components';
import { ExecutionConfig, OpConfig } from '@terascope/types';
import { KeyRouter, KeyRouterConfig } from '@terascope/standard-asset-apis';

export default class KeyRouterProcessor extends MapProcessor<KeyRouterConfig> {
    router: KeyRouter;

    constructor(
        context: Context,
        opConfig: KeyRouterConfig & OpConfig,
        exConfig: ExecutionConfig
    ) {
        super(context, opConfig, exConfig);
        this.router = new KeyRouter(opConfig);
    }

    map(record: DataEntity): DataEntity {
        record.setMetadata(
            'standard:route',
            this.router.lookup(record),
        );
        return record;
    }
}
