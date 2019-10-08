"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const data_window_1 = __importDefault(require("../helpers/data-window"));
const accumulator_1 = __importDefault(require("../helpers/accumulator"));
class Accumulate extends job_components_1.BatchProcessor {
    constructor(context, opConfig, exConfig) {
        super(context, opConfig, exConfig);
        this.flushData = false;
        this.shuttingDown = false;
        this.accumulator = new accumulator_1.default(this.opConfig.empty_after);
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
        if (dataArray.length === 0)
            this.accumulator.emptySlice();
        else
            this.accumulator.accumulate(dataArray);
        let results = [];
        // FIXME:
        // eslint-disable-next-line max-len
        if ((this.accumulator.readyToEmpty() || this.flushData) && this.accumulator.records.length > 0) {
            // @ts-ignore FIXME:
            results = data_window_1.default.make(this.opConfig.data_window_key, this.accumulator.records);
            this.accumulator.records = [];
        }
        return results;
    }
}
exports.default = Accumulate;
//# sourceMappingURL=processor.js.map