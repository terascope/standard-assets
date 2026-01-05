import { DataEntity } from '@terascope/core-utils';
import { BatchProcessor } from '@terascope/job-components';
import { OutputPhase, Loader, OperationsManager } from 'ts-transforms';
import { PhaseConfig } from '../transform/interfaces.js';
import { loadResources } from '../__lib/utils.js';

export default class Output extends BatchProcessor<PhaseConfig> {
    private phase!: OutputPhase;

    async initialize(): Promise<void> {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await loadResources(this.opConfig, getPath);
        const loader = new Loader(opConfig, this.logger);
        const opsManager = new OperationsManager(plugins);
        const { output } = await loader.load(opsManager);
        this.phase = new OutputPhase(opConfig, output, opsManager);
    }

    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        return this.phase.run(data);
    }
}
