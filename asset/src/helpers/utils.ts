
import { get, getUnixTime } from '@terascope/job-components';

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
    return getUnixTime(field);
}
