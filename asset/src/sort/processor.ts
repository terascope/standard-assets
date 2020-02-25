import { sort } from 'timsort';
import { BatchProcessor, WorkerContext, ExecutionConfig } from '@terascope/job-components';
import { sortFunction } from '../__lib/utils';
import DataWindow from '../__lib/data-window';
import { SortConfig } from './interfaces';

export default class Sort extends BatchProcessor<SortConfig> {
    sort: (a: any, b: any) => number;

    constructor(context: WorkerContext, opConfig: SortConfig, executionConfig: ExecutionConfig) {
        super(context, opConfig, executionConfig);
        this.sort = sortFunction(this.opConfig.field, this.opConfig.order).bind(this);
    }

    // @ts-ignore
    onBatch(dataArray: DataWindow[]) {
        if (dataArray.length > 0 && dataArray[0] instanceof DataWindow) {
            dataArray.forEach((dataWindow) => sort(dataWindow.asArray(), this.sort));
        } else {
            sort<DataWindow>(dataArray, this.sort);
        }

        return dataArray;
    }
}
