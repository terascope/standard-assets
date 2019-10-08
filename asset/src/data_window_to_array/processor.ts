
import { BatchProcessor, DataEntity, OpConfig } from '@terascope/job-components';
import DataWindow from '../helpers/data-window';

export default class DataWindowToArray extends BatchProcessor<OpConfig> {
    // @ts-ignore
    onBatch(dataArray: DataWindow[]) {
        const results: DataEntity[] = [];

        return dataArray.reduce((allDocs, window) => {
            window.asArray().forEach((doc: DataEntity) => allDocs.push(doc));
            return allDocs;
        }, results);
    }
}
