import {
    BatchProcessor, WorkerContext, ExecutionConfig, DataEntity
} from '@terascope/job-components';
import { AccumulateByKeyConfig } from './interfaces';
import AccumulatorByKey from '../__lib/accumulator-key';

export default class AccumulateByKey extends BatchProcessor<AccumulateByKeyConfig> {
    flushData = false;
    accumulator: AccumulatorByKey

    constructor(
        context: WorkerContext, opConfig: AccumulateByKeyConfig, exConfig: ExecutionConfig
    ) {
        super(context, opConfig, exConfig);
        const { empty_after: emptyAfter } = opConfig;
        this.accumulator = new AccumulatorByKey(emptyAfter, opConfig);
    }

    onFlushStart(): void {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd(): void {
        this.flushData = false;
    }

    async onBatch(dataArray: DataEntity[]): Promise<DataEntity[]> {
        // on shutdown event return accumulated data
        if (dataArray.length === 0) this.accumulator.emptySlice();
        else this.accumulator.add(dataArray);

        if (this.accumulator.readyToEmpty() || this.flushData) return this.accumulator.flush();
        return [];
    }
}
