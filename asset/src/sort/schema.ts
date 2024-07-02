import { ConvictSchema } from '@terascope/job-components';
import { SortConfig } from './interfaces.js';
import { Order } from '../__lib/utils.js';

export default class Schema extends ConvictSchema<SortConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'The field in the input records to use for sorting',
                default: null,
                format: 'required_String',
            },
            order: {
                doc: 'The order in which it will be sorted',
                default: Order.asc,
                format: Object.values(Order)
            }
        };
    }
}
