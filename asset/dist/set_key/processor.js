"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const data_window_1 = __importDefault(require("../helpers/data-window"));
class SetKey extends job_components_1.MapProcessor {
    _setKey(doc) {
        if (job_components_1.DataEntity.isDataEntity(doc)) {
            doc.setMetadata('_key', doc[this.opConfig.field]);
            return doc;
        }
        return job_components_1.DataEntity.make(doc, { _key: doc[this.opConfig.field] });
    }
    map(doc) {
        if (doc instanceof data_window_1.default) {
            doc.dataArray = doc.asArray().map((item) => this._setKey(item));
            return doc;
        }
        return this._setKey(doc);
    }
}
exports.default = SetKey;
//# sourceMappingURL=processor.js.map