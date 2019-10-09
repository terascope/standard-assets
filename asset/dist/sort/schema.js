"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
const utils_1 = require("../helpers/utils");
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
                default: utils_1.Order.asc,
                format: Object.values(utils_1.Order)
            }
        };
    }
}
exports.default = Schema;
//# sourceMappingURL=schema.js.map