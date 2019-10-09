
import { OpConfig } from '@terascope/job-components';
import { Order } from '../helpers/utils';

export interface SortConfig extends OpConfig {
    field: string;
    order: Order;
}
