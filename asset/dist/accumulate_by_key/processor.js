"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const accumulator_key_1 = __importDefault(require("../helpers/accumulator-key"));
const utils_1 = require("../helpers/utils");
class AccumulateByKey extends job_components_1.BatchProcessor {
    constructor(ctxt, opConfig, exConfig) {
        super(ctxt, opConfig, exConfig);
        this.flushData = false;
        const { empty_after: emptyAfter, key_field: keyField } = opConfig;
        this.accumulator = new accumulator_key_1.default(emptyAfter, keyField);
        this.sort = utils_1.sortFunction(this.opConfig.field, this.opConfig.order);
    }
    onFlushStart() {
        if (this.opConfig.flush_data_on_shutdown)
            this.flushData = true;
    }
    onFlushEnd() {
        this.flushData = false;
    }
    _batchData() {
        const result = [];
        let resultSize = 0;
        const { buckets } = this.accumulator;
        if (this.opConfig.batch_return === true) {
            const dataWindowKeys = buckets.keys();
            while (resultSize < this.opConfig.batch_size && this.accumulator.buckets.size !== 0) {
                const key = dataWindowKeys.next().value;
                result.push(buckets.get(key));
                resultSize += buckets.get(key).asArray().length;
                buckets.delete(key);
            }
        }
        else {
            for (const dataWindow of buckets.values()) {
                result.push(dataWindow);
            }
            buckets.clear();
        }
        return result;
    }
    // @ts-ignore
    onBatch(dataArray) {
        // TODO: does this work as intended?
        // on shutdown event return accumulated data
        if (dataArray.length === 0)
            this.accumulator.emptySlice();
        else
            this.accumulator.accumulate(dataArray);
        if (this.accumulator.readyToEmpty() || this.flushData)
            return this._batchData();
        return [];
    }
}
exports.default = AccumulateByKey;
//# sourceMappingURL=processor.js.map