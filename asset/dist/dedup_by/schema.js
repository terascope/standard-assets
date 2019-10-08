"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
class Schema extends job_components_1.ConvictSchema {
    build() {
        return {
            field: {
                doc: 'field to dedup records on',
                default: undefined,
                format: 'String',
            },
            adjust_time: {
                doc: 'Adjust first and last seen',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
exports.default = Schema;
//# sourceMappingURL=schema.js.map