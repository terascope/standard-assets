import { DataEntity } from '@terascope/core-utils';
import { BatchProcessor } from '@terascope/job-components';
import { Transform } from 'ts-transforms';
import { PhaseConfig } from './interfaces.js';
import { loadResources } from '../__lib/utils.js';

export default class Transforms extends BatchProcessor<PhaseConfig> {
    private transform!: Transform;

    async initialize(): Promise<void> {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await loadResources(this.opConfig, getPath);
        this.transform = new Transform(opConfig, this.logger);
        return this.transform.init(plugins);
    }

    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        return this.transform.run(data);
    }
}
