"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const ts_transforms_1 = require("ts-transforms");
const utils_1 = require("../helpers/utils");
class Match extends job_components_1.BatchProcessor {
    constructor(context, opConfig, executionConfig) {
        super(context, opConfig, executionConfig);
    }
    async initialize() {
        const { getPath } = this.context.apis.assets;
        const { opConfig, plugins } = await utils_1.loadResources(this.opConfig, getPath);
        this.matcher = new ts_transforms_1.Matcher(opConfig, this.logger);
        return this.matcher.init(plugins);
    }
    async onBatch(data) {
        return this.matcher.run(data);
    }
}
exports.default = Match;
//# sourceMappingURL=processor.js.map