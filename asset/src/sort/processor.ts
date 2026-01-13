import { sort } from 'timsort';
import { DataEntity } from '@terascope/core-utils';
import {
    BatchProcessor, Context
} from '@terascope/job-components';
import { ExecutionConfig } from '@terascope/types';
import { sortFunction } from '../__lib/utils.js';
import DataWindow from '../__lib/data-window.js';
import { SortConfig } from './interfaces.js';

export default class Sort extends BatchProcessor<SortConfig> {
    sort: (a: any, b: any) => number;

    constructor(context: Context, opConfig: SortConfig, executionConfig: ExecutionConfig) {
        super(context, opConfig, executionConfig);
        this.sort = sortFunction(this.opConfig.field, this.opConfig.order).bind(this);
    }

    async onBatch(dataArray: DataWindow[]): Promise<DataEntity[]> {
        if (dataArray.length > 0 && dataArray[0] instanceof DataWindow) {
            dataArray.forEach((dataWindow) => sort(dataWindow.asArray(), this.sort));
        } else {
            sort<DataWindow>(dataArray, this.sort);
        }

        return dataArray as DataEntity[];
    }
}
