import { BatchProcessor, DataEntity, OpConfig } from '@terascope/job-components';
import DataWindow from '../__lib/data-window.js';

export default class DataWindowToArray extends BatchProcessor<OpConfig> {
    async onBatch(dataArray: DataWindow[]): Promise<DataEntity[]> {
        const results: DataEntity[] = [];

        return dataArray.reduce((allDocs, window) => {
            allDocs.push(...window.asArray());
            return allDocs;
        }, results);
    }
}
