"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const data_window_1 = __importDefault(require("../helpers/data-window"));
class Dedup extends job_components_1.BatchProcessor {
    // TODO: review this
    _millisecondTime(time) {
        return isNaN(time) ? Date.parse(time) : +time;
    }
    _adjustTimes(original, doc) {
        if (this._millisecondTime(doc.first_seen) < this._millisecondTime(original.first_seen)) {
            original.first_seen = doc.first_seen;
        }
        if (this._millisecondTime(doc.last_seen) > this._millisecondTime(original.last_seen)) {
            original.last_seen = doc.last_seen;
        }
    }
    _dedup(dataArray) {
        const uniqDocs = new Map();
        dataArray.forEach((doc) => {
            let key;
            if (this.opConfig.field)
                key = doc[this.opConfig.field];
            else
                key = data_window_1.default.getMetadata(doc, '_key');
            if (uniqDocs.has(key)) {
                // need to adjust first and last seen
                if (this.opConfig.adjust_time === true) {
                    this._adjustTimes(uniqDocs.get(key), doc);
                }
                return;
            }
            uniqDocs.set(key, doc);
        });
        return [...uniqDocs.values()];
    }
    // @ts-ignore
    onBatch(dataArray) {
        if (dataArray.length > 0 && dataArray[0] instanceof data_window_1.default) {
            dataArray.forEach((window) => {
                window.dataArray = this._dedup(window.dataArray);
            });
            return dataArray;
        }
        return this._dedup(dataArray);
    }
}
exports.default = Dedup;
//# sourceMappingURL=processor.js.map