
import { OpConfig } from '@terascope/job-components';

export enum Order {
    asc = 'asc',
    desc = 'desc'
}

export interface SortConfig extends OpConfig {
    field: string;
    order: Order;
}
