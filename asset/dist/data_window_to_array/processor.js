"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
class DataWindowToArray extends job_components_1.BatchProcessor {
    // @ts-ignore
    onBatch(dataArray) {
        const results = [];
        return dataArray.reduce((allDocs, window) => {
            window.asArray().forEach((doc) => allDocs.push(doc));
            return allDocs;
        }, results);
    }
}
exports.default = DataWindowToArray;
//# sourceMappingURL=processor.js.map