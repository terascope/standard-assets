import {
    BatchProcessor, DataEntity, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import { AccumulateConfig } from './interfaces';
import DataWindow from '../helpers/data-window';
import Accumulator from '../helpers/accumulator';

export default class Accumulate extends BatchProcessor<AccumulateConfig> {
    flushData = false;
    shuttingDown = false;
    accum: Accumulator;

    constructor(context: WorkerContext, opConfig: AccumulateConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.accum = new Accumulator(this.opConfig.empty_after);
    }

    onFlushStart() {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd() {
        this.flushData = false;
    }

    // @ts-ignore
    onBatch(dataArray: DataEntity[]) {
        if (dataArray.length === 0) this.accum.emptySlice();
        else this.accum.add(dataArray);
        let results: DataEntity[] = [];
        if ((this.accum.readyToEmpty() || this.flushData) && this.accum.size > 0) {
            // @ts-ignore TODO: we are ignorinng util DataWindow is native to DataEntity
            results = DataWindow.make(this.opConfig.data_window_key, this.accum.flush());
        }

        return results;
    }
}
