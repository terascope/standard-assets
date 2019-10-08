
import {
    BatchProcessor, DataEntity, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import { AccumulateConfig } from './interfaces';
import DataWindow from '../helpers/data-window';
import Accumulator from '../helpers/accumulator';

export default class Accumulate extends BatchProcessor<AccumulateConfig> {
    flushData = false;
    shuttingDown = false;
    accumulator: Accumulator;

    constructor(context: WorkerContext, opConfig: AccumulateConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.accumulator = new Accumulator(this.opConfig.empty_after);
    }

    onFlushStart() {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd() {
        this.flushData = false;
    }

    // @ts-ignore
    onBatch(dataArray: DataEntity[]) {
        if (dataArray.length === 0) this.accumulator.emptySlice();
        else this.accumulator.accumulate(dataArray);
        let results: DataEntity[] = [];
        // FIXME:
        // eslint-disable-next-line max-len
        if ((this.accumulator.readyToEmpty() || this.flushData) && this.accumulator.records.length > 0) {
            // @ts-ignore FIXME:
            results = DataWindow.make(this.opConfig.data_window_key, this.accumulator.records);
            this.accumulator.records = [];
        }

        return results;
    }
}
