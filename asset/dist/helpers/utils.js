"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
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
async function formatPaths(getPath, paths) {
    const splitPaths = paths.map((pathStr) => pathStr.split(':'));
    const assetPaths = splitPaths.map((arr) => getPath(arr[0]));
    const results = await Promise.all(assetPaths);
    return results.map((assetPath, ind) => path_1.default.join(assetPath, splitPaths[ind][1]));
}
async function loadResources(opConfig, getPaths) {
    let plugins;
    if (opConfig.rules) {
        const rules = await formatPaths(getPaths, opConfig.rules);
        Object.assign(opConfig, { rules });
    }
    if (opConfig.plugins) {
        const pluginPaths = await formatPaths(getPaths, opConfig.plugins);
        Object.assign(opConfig, { plugins: pluginPaths });
        plugins = pluginPaths.map((pPath) => {
            const myPlugin = require(pPath);
            // if es6 import default, else use regular node required obj
            return job_components_1.get(myPlugin, 'default', myPlugin);
        });
    }
    return { opConfig, plugins };
}
exports.loadResources = loadResources;
//# sourceMappingURL=utils.js.map