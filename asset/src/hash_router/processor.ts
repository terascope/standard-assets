import {
    MapProcessor,
    DataEntity,
    WorkerContext,
    ExecutionConfig,
    isEmpty,
    toString
} from '@terascope/job-components';
import fnv1a from '@sindresorhus/fnv1a';
import { HashRouterConfig } from './interfaces';

function makeHashFn(config: HashRouterConfig) {
    if (isEmpty(config.fields)) return (record: DataEntity) => toString(record.getKey());

    const fields = config.fields.slice();

    return (record: DataEntity) => {
        let hashString = '';

        fields.forEach((field) => {
            hashString += `${record[field]}`;
        });

        return hashString;
    };
}

export default class HashRouter extends MapProcessor<HashRouterConfig> {
    createHash: (record: DataEntity) => string;

    constructor(context: WorkerContext, opConfig: HashRouterConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.createHash = makeHashFn(opConfig);
    }

    addPath(record: DataEntity) {
        const hashStr = this.createHash(record);
        const partition = fnv1a(hashStr) % this.opConfig.buckets;

        record.setMetadata(
            'standard:route',
            `${partition}`
        );
    }

    map(record: DataEntity) {
        this.addPath(record);
        return record;
    }
}
