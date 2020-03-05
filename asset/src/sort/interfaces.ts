import { OpConfig } from '@terascope/job-components';
import { Order } from '../__lib/utils';

export interface SortConfig extends OpConfig {
    field: string;
    order: Order;
}
