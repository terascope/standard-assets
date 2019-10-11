
import {
    BatchProcessor, WorkerContext, ExecutionConfig, DataEntity
} from '@terascope/job-components';
import { AccumulateByKeyConfig } from './interfaces';
import AccumulatorByKey from '../helpers/accumulator-key';

export default class AccumulateByKey extends BatchProcessor<AccumulateByKeyConfig> {
    flushData = false;
    accumulator: AccumulatorByKey

    constructor(ctxt: WorkerContext, opConfig: AccumulateByKeyConfig, exConfig: ExecutionConfig) {
        super(ctxt, opConfig, exConfig);
        const { empty_after: emptyAfter } = opConfig;
        this.accumulator = new AccumulatorByKey(emptyAfter, opConfig);
    }

    onFlushStart() {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd() {
        this.flushData = false;
    }

    // @ts-ignore
    onBatch(dataArray: DataEntity[]) {
        // on shutdown event return accumulated data
        if (dataArray.length === 0) this.accumulator.emptySlice();
        else this.accumulator.add(dataArray);

        if (this.accumulator.readyToEmpty() || this.flushData) return this.accumulator.flush();
        return [];
    }
}
