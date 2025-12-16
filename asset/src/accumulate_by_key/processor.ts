import { DataEntity } from '@terascope/core-utils';
import { BatchProcessor, Context } from '@terascope/job-components';
import { ExecutionConfig } from '@terascope/types';
import { AccumulateByKeyConfig } from './interfaces.js';
import AccumulatorByKey from '../__lib/accumulator-key.js';

export default class AccumulateByKey extends BatchProcessor<AccumulateByKeyConfig> {
    flushData = false;
    accumulator: AccumulatorByKey;

    constructor(
        context: Context, opConfig: AccumulateByKeyConfig, exConfig: ExecutionConfig
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
        if (dataArray.length === 0) {
            this.accumulator.emptySlice();
        } else {
            this.accumulator.add(dataArray);
        }

        if (this.accumulator.readyToEmpty() || this.flushData) {
            return this.accumulator.flush();
        }

        return [];
    }
}
