"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const accumulator_1 = __importDefault(require("./accumulator"));
const data_window_1 = __importDefault(require("./data-window"));
class AccumulatorByKey extends accumulator_1.default {
    constructor(emptyAfter, config) {
        super(emptyAfter);
        this.buckets = new Map();
        const { batch_size: batchSize, key_field: keyField, batch_return: batchReturn } = config;
        this.keyField = keyField;
        this.batchReturn = batchReturn;
        this.batchSize = batchSize;
    }
    readyToEmpty() {
        return super.readyToEmpty() && this.buckets.size > 0;
    }
    add(dataArray) {
        this.emptySliceCount = 0;
        dataArray.forEach((doc) => {
            let key;
            if (this.keyField)
                key = doc[this.keyField];
            else
                key = doc.getMetadata('_key');
            if (key === undefined)
                return;
            if (Buffer.isBuffer(key)) {
                key = key.toString('utf8');
            }
            if (!this.buckets.has(key)) {
                this.buckets.set(key, data_window_1.default.make(key));
            }
            this.buckets.get(key).set(doc);
        });
    }
    flush() {
        const result = [];
        let resultSize = 0;
        if (this.batchReturn === true) {
            const dataWindowKeys = this.buckets.keys();
            while (resultSize < this.batchSize && this.buckets.size !== 0) {
                const key = dataWindowKeys.next().value;
                result.push(this.buckets.get(key));
                resultSize += this.buckets.get(key).asArray().length;
                this.buckets.delete(key);
            }
        }
        else {
            for (const dataWindow of this.buckets.values()) {
                result.push(dataWindow);
            }
            this.buckets.clear();
        }
        return result;
    }
}
exports.default = AccumulatorByKey;
//# sourceMappingURL=accumulator-key.js.map