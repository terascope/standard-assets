"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const data_window_1 = __importDefault(require("../helpers/data-window"));
/*
    handles an array of data entities or an array of data windows
*/
class GroupBy extends job_components_1.BatchProcessor {
    constructor() {
        super(...arguments);
        this.groups = new Map();
    }
    _group(doc) {
        let key;
        if (this.opConfig.field)
            key = doc[this.opConfig.field];
        else
            key = data_window_1.default.getMetadata(doc, '_key');
        if (Buffer.isBuffer(key)) {
            key.toString('utf8');
        }
        if (!this.groups.has(key)) {
            this.groups.set(key, []);
        }
        this.groups.get(key).push(doc);
    }
    // @ts-ignore
    onBatch(dataArray) {
        dataArray.forEach((doc) => {
            if (doc instanceof data_window_1.default) {
                doc.asArray().forEach((item) => this._group(item));
            }
            else {
                this._group(doc);
            }
        });
        const results = [];
        for (const [key, value] of this.groups.entries()) {
            const newDataWindow = data_window_1.default.make(key, value);
            results.push(newDataWindow);
        }
        this.groups.clear();
        return results;
    }
}
exports.default = GroupBy;
//# sourceMappingURL=processor.js.map