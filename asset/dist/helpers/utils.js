"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
// TODO: fix types
function sortFunction(field, order) {
    const sortDescending = (a, b) => {
        if (job_components_1.get(a, field) === job_components_1.get(b, field))
            return 0;
        return (job_components_1.get(a, field) < job_components_1.get(b, field) ? 1 : -1);
    };
    // Default to ascending
    let sort = (a, b) => {
        if (job_components_1.get(a, field) === job_components_1.get(b, field))
            return 0;
        return (job_components_1.get(a, field) > job_components_1.get(b, field) ? 1 : -1);
    };
    if (order === 'desc')
        sort = sortDescending;
    return sort;
}
exports.sortFunction = sortFunction;
//# sourceMappingURL=utils.js.map