import { ConvictSchema } from '@terascope/job-components';
import { SortConfig } from './interfaces';
import { Order } from '../__lib/utils';

export default class Schema extends ConvictSchema<SortConfig> {
    build() {
        return {
            field: {
                doc: 'The field in the input records to use for sorting',
                default: '',
                format: 'String',
            },
            order: {
                doc: 'The field in the input records to use for sorting',
                default: Order.asc,
                format: Object.values(Order)
            }
        };
    }
}
