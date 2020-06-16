import {
    BatchProcessor, DataEntity, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import { AccumulateConfig } from './interfaces';
import DataWindow from '../__lib/data-window';
import Accumulator from '../__lib/accumulator';

export default class Accumulate extends BatchProcessor<AccumulateConfig> {
    flushData = false;
    shuttingDown = false;
    accum: Accumulator;

    constructor(context: WorkerContext, opConfig: AccumulateConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.accum = new Accumulator(this.opConfig.empty_after);
    }

    onFlushStart(): void {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd(): void {
        this.flushData = false;
    }

    async onBatch(dataArray: DataEntity[]): Promise<DataEntity[]> {
        if (dataArray.length === 0) this.accum.emptySlice();
        else this.accum.add(dataArray);
        let results: DataEntity[] = [];
        if ((this.accum.readyToEmpty() || this.flushData) && this.accum.size > 0) {
            // @ts-expect-error TODO: we are ignorinng util DataWindow is native to DataEntity
            results = DataWindow.make(this.opConfig.data_window_key, this.accum.flush());
        }

        return results as DataEntity[];
    }
}
