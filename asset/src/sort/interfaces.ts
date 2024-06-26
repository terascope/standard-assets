import { OpConfig } from '@terascope/types';
import { Order } from '../__lib/utils.js';

export interface SortConfig extends OpConfig {
    field: string;
    order: Order;
}
