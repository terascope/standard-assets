import {
    BatchProcessor, DataEntity, WorkerContext, ExecutionConfig
} from '@terascope/job-components';
import { AccumulateConfig } from './interfaces';
import DataWindow from '../__lib/data-window';
import Accumulator from '../__lib/accumulator';

export default class Accumulate extends BatchProcessor<AccumulateConfig> {
    flushData = false;
    shuttingDown = false;
    accumulator: Accumulator;

    constructor(context: WorkerContext, opConfig: AccumulateConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.accumulator = new Accumulator(this.opConfig.empty_after);
    }

    onFlushStart(): void {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd(): void {
        this.flushData = false;
    }

    async onBatch(dataArray: DataEntity[]): Promise<DataEntity[]> {
        if (dataArray.length === 0) this.accumulator.emptySlice();
        else this.accumulator.add(dataArray);
        let results: DataEntity[] = [];
        if ((this.accumulator.readyToEmpty() || this.flushData) && this.accumulator.size > 0) {
            results = DataWindow.make(
                this.opConfig.data_window_key,
                this.accumulator.flush()
            ) as unknown as DataEntity[];
        }

        return results as DataEntity[];
    }
}
