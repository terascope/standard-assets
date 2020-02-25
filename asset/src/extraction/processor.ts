import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { ExtractionPhase, Loader, OperationsManager } from 'ts-transforms';
import { PhaseConfig } from '../transform/interfaces';
import { loadResources } from '../__lib/utils';

export default class Extraction extends BatchProcessor<PhaseConfig> {
    private phase!: ExtractionPhase;

    async initialize() {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await loadResources(this.opConfig, getPath);
        const loader = new Loader(opConfig, this.logger);
        const opsManager = new OperationsManager(plugins);
        const { extractions } = await loader.load(opsManager);
        this.phase = new ExtractionPhase(opConfig, extractions, opsManager);
    }

    async onBatch(data: DataEntity[]) {
        return this.phase.run(data);
    }
}
