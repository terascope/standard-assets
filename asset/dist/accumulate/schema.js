"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
class Schema extends job_components_1.ConvictSchema {
    build() {
        return {
            empty_after: {
                doc: 'How many 0 record slices to require before starting to return the accumulated data',
                default: 10,
                format: 'Number'
            },
            flush_data_on_shutdown: {
                doc: 'Option to flush partial data accumulation on unexpected shutdown',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
exports.default = Schema;
//# sourceMappingURL=schema.js.map