"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
class Schema extends job_components_1.ConvictSchema {
    build() {
        return {
            field: {
                doc: 'Field name of value used to set key',
                default: '_id',
                format: 'required_String',
            }
        };
    }
}
exports.default = Schema;
//# sourceMappingURL=schema.js.map