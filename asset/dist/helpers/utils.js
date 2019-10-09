"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_components_1 = require("@terascope/job-components");
var Order;
(function (Order) {
    Order["asc"] = "asc";
    Order["desc"] = "desc";
})(Order = exports.Order || (exports.Order = {}));
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
function getTime(field) {
    if (field == null)
        return false;
    return job_components_1.getUnixTime(field);
}
exports.getTime = getTime;
//# sourceMappingURL=utils.js.map