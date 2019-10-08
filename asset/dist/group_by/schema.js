"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
class Schema extends job_components_1.ConvictSchema {
    build() {
        return {
            field: {
                doc: 'Name of field to group each record by',
                default: undefined,
                format: 'String',
            }
        };
    }
}
exports.default = Schema;
//# sourceMappingURL=schema.js.map