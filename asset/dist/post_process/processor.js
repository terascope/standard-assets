"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const ts_transforms_1 = require("ts-transforms");
const utils_1 = require("../helpers/utils");
class PostProcess extends job_components_1.BatchProcessor {
    async initialize() {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await utils_1.loadResources(this.opConfig, getPath);
        const loader = new ts_transforms_1.Loader(opConfig, this.logger);
        const opsManager = new ts_transforms_1.OperationsManager(plugins);
        const { postProcessing } = await loader.load(opsManager);
        this.phase = new ts_transforms_1.PostProcessPhase(opConfig, postProcessing, opsManager);
    }
    async onBatch(data) {
        return this.phase.run(data);
    }
}
exports.default = PostProcess;
//# sourceMappingURL=processor.js.map