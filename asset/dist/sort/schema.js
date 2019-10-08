"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const interfaces_1 = require("./interfaces");
class Schema extends job_components_1.ConvictSchema {
    build() {
        return {
            field: {
                doc: 'The field in the input records to use for sorting',
                default: '',
                format: 'String',
            },
            order: {
                doc: 'The field in the input records to use for sorting',
                default: interfaces_1.Order.asc,
                format: Object.values(interfaces_1.Order)
            }
        };
    }
}
exports.default = Schema;
//# sourceMappingURL=schema.js.map