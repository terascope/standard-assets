import { DataEntity } from '@terascope/core-utils';
import {
    Context, BatchProcessor
} from '@terascope/job-components';
import { ExecutionConfig } from '@terascope/types';
import { Matcher } from 'ts-transforms';
import { PhaseConfig } from '../transform/interfaces.js';
import { loadResources } from '../__lib/utils.js';

export default class Match extends BatchProcessor<PhaseConfig> {
    private matcher!: Matcher;

    constructor(context: Context, opConfig: PhaseConfig, executionConfig: ExecutionConfig) {
        super(context, opConfig, executionConfig);
    }

    async initialize(): Promise<void> {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await loadResources(this.opConfig, getPath);
        this.matcher = new Matcher(opConfig, this.logger);
        return this.matcher.init(plugins);
    }

    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        return this.matcher.run(data);
    }
}
