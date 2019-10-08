
import { get } from '@terascope/job-components';

type Order = 'desc' | 'asc';

// TODO: fix types

export function sortFunction(field: string, order: Order) {
    const sortDescending = (a: any, b: any) => {
        if (get(a, field) === get(b, field)) return 0;
        return (get(a, field) < get(b, field) ? 1 : -1);
    };

    // Default to ascending
    let sort = (a: any, b: any) => {
        if (get(a, field) === get(b, field)) return 0;
        return (get(a, field) > get(b, field) ? 1 : -1);
    };

    if (order === 'desc') sort = sortDescending;

    return sort;
}
