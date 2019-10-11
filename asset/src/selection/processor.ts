
import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { SelectionPhase, Loader, OperationsManager } from 'ts-transforms';
import { PhaseConfig } from '../transform/interfaces';
import { loadResources } from '../helpers/utils';

export default class Selection extends BatchProcessor<PhaseConfig> {
    private phase!: SelectionPhase;

    async initialize() {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await loadResources(this.opConfig, getPath);
        const loader = new Loader(opConfig, this.logger);
        const opsManager = new OperationsManager(plugins);
        const { selectors } = await loader.load(opsManager);
        this.phase = new SelectionPhase(opConfig, selectors, opsManager);
    }

    async onBatch(data: DataEntity[]) {
        return this.phase.run(data);
    }
}
