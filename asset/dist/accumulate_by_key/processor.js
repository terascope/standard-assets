"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const accumulator_key_1 = __importDefault(require("../helpers/accumulator-key"));
class AccumulateByKey extends job_components_1.BatchProcessor {
    constructor(ctxt, opConfig, exConfig) {
        super(ctxt, opConfig, exConfig);
        this.flushData = false;
        const { empty_after: emptyAfter } = opConfig;
        this.accumulator = new accumulator_key_1.default(emptyAfter, opConfig);
    }
    onFlushStart() {
        if (this.opConfig.flush_data_on_shutdown)
            this.flushData = true;
    }
    onFlushEnd() {
        this.flushData = false;
    }
    // @ts-ignore
    onBatch(dataArray) {
        // on shutdown event return accumulated data
        if (dataArray.length === 0)
            this.accumulator.emptySlice();
        else
            this.accumulator.add(dataArray);
        if (this.accumulator.readyToEmpty() || this.flushData)
            return this.accumulator.flush();
        return [];
    }
}
exports.default = AccumulateByKey;
//# sourceMappingURL=processor.js.map