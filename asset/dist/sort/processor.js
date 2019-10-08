"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timsort_1 = require("timsort");
const job_components_1 = require("@terascope/job-components");
const utils_1 = require("../helpers/utils");
const data_window_1 = __importDefault(require("../helpers/data-window"));
class Sort extends job_components_1.BatchProcessor {
    constructor(context, opConfig, executionConfig) {
        super(context, opConfig, executionConfig);
        this.sort = utils_1.sortFunction(this.opConfig.field, this.opConfig.order).bind(this);
    }
    // @ts-ignore
    onBatch(dataArray) {
        if (dataArray.length > 0 && dataArray[0] instanceof data_window_1.default) {
            dataArray.forEach((dataWindow) => timsort_1.sort(dataWindow.asArray(), this.sort));
        }
        else {
            timsort_1.sort(dataArray, this.sort);
        }
        return dataArray;
    }
}
exports.default = Sort;
//# sourceMappingURL=processor.js.map