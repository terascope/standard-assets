import {
    MapProcessor, DataEntity, WorkerContext, ExecutionConfig, toString
} from '@terascope/job-components';
import { KeyRouterConfig, CaseOptions, FromOptions } from './interfaces';

function extraction(config: KeyRouterConfig) {
    if (config.use && config.from) {
        if (config.from === FromOptions.end) {
            return (data: string) => data.slice(-Math.abs(config.use as number));
        }
        return (data: string) => data.slice(0, config.use);
    }

    return (data: string) => data;
}

function caseTransforms(config: KeyRouterConfig) {
    if (config.case === CaseOptions.lower) {
        return (data: string) => data.toLowerCase();
    }

    if (config.case === CaseOptions.upper) {
        return (data: string) => data.toUpperCase();
    }

    return (data: string) => data;
}

export default class KeyRouter extends MapProcessor<KeyRouterConfig> {
    transforms: (data: string) => string;

    constructor(context: WorkerContext, opConfig: KeyRouterConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        const extractionFn = extraction(opConfig);
        const caseFn = caseTransforms(opConfig);

        this.transforms = (data: string) => caseFn(extractionFn(data));
    }

    addMeta(record: DataEntity) {
        const metaKey = toString(record.getKey());
        const key = this.transforms(metaKey);

        record.setMetadata(
            'standard:route',
            key,
        );
    }

    map(record: DataEntity) {
        this.addMeta(record);
        return record;
    }
}
