"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const accumulator_1 = __importDefault(require("./accumulator"));
const data_window_1 = __importDefault(require("./data-window"));
class AccumulatorByKey extends accumulator_1.default {
    constructor(emptyAfter, keyField) {
        super(emptyAfter);
        this.buckets = new Map();
        this.keyField = keyField;
    }
    readyToEmpty() {
        return super.readyToEmpty() && this.buckets.size > 0;
    }
    accumulate(dataArray) {
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
}
exports.default = AccumulatorByKey;
//# sourceMappingURL=accumulator-key.js.map