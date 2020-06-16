import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { PostProcessPhase, Loader, OperationsManager } from 'ts-transforms';
import { PhaseConfig } from '../transform/interfaces';
import { loadResources } from '../__lib/utils';

export default class PostProcess extends BatchProcessor<PhaseConfig> {
    private phase!: PostProcessPhase;

    async initialize(): Promise<void> {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await loadResources(this.opConfig, getPath);
        const loader = new Loader(opConfig, this.logger);
        const opsManager = new OperationsManager(plugins);
        const { postProcessing } = await loader.load(opsManager);
        this.phase = new PostProcessPhase(opConfig, postProcessing, opsManager);
    }

    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        return this.phase.run(data);
    }
}
