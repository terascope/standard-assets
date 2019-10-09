"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const ts_transforms_1 = require("ts-transforms");
const utils_1 = require("../helpers/utils");
class Transforms extends job_components_1.BatchProcessor {
    async initialize() {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await utils_1.loadResources(this.opConfig, getPath);
        this.transform = new ts_transforms_1.Transform(opConfig, this.logger);
        return this.transform.init(plugins);
    }
    async onBatch(data) {
        return this.transform.run(data);
    }
}
exports.default = Transforms;
//# sourceMappingURL=processor.js.map