import path from 'path';
import { get, getTime as tsGetTime } from '@terascope/job-components';
import { PhaseConfig } from '../transform/interfaces';

export enum Order {
    asc = 'asc',
    desc = 'desc'
}

export function sortFunction(field: string, order: Order) {
    const sortDescending = (a: number, b: number) => {
        if (get(a, field) === get(b, field)) return 0;
        return (get(a, field) < get(b, field) ? 1 : -1);
    };

    // Default to ascending
    let sort = (a: number, b: number) => {
        if (get(a, field) === get(b, field)) return 0;
        return (get(a, field) > get(b, field) ? 1 : -1);
    };

    if (order === 'desc') sort = sortDescending;

    return sort;
}

export function getTime(field: string) {
    if (field == null) return false;
    return tsGetTime(field);
}

type getPath = (name: string) => Promise<string>;

async function formatPaths(getPath: getPath, paths: string[]) {
    const splitPaths = paths.map((pathStr) => pathStr.split(':'));
    const assetPaths = splitPaths.map((arr) => getPath(arr[0]));
    const results = await Promise.all(assetPaths);
    return results.map((assetPath, ind) => path.join(assetPath, splitPaths[ind][1]));
}

export async function loadResources(opConfig: PhaseConfig, getPaths: getPath) {
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
            return get(myPlugin, 'default', myPlugin);
        });
    }
    return { opConfig, plugins };
}
