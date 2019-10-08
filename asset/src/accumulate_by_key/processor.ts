
import {
    BatchProcessor, WorkerContext, ExecutionConfig, DataEntity
} from '@terascope/job-components';
import { AccumulateByKeyConfig } from './interfaces';
import AccumulatorByKey from '../helpers/accumulator-key';
import { sortFunction } from '../helpers/utils';
import DataWindow from '../helpers/data-window';

export default class AccumulateByKey extends BatchProcessor<AccumulateByKeyConfig> {
    flushData = false;
    sort: (a: DataWindow, b: DataWindow) => number;
    accumulator: AccumulatorByKey

    constructor(ctxt: WorkerContext, opConfig: AccumulateByKeyConfig, exConfig: ExecutionConfig) {
        super(ctxt, opConfig, exConfig);
        const { empty_after: emptyAfter, key_field: keyField } = opConfig;
        this.accumulator = new AccumulatorByKey(emptyAfter, keyField);
        this.sort = sortFunction(this.opConfig.field, this.opConfig.order);
    }

    onFlushStart() {
        if (this.opConfig.flush_data_on_shutdown) this.flushData = true;
    }

    onFlushEnd() {
        this.flushData = false;
    }

    _batchData() {
        const result = [];
        let resultSize = 0;
        const { buckets } = this.accumulator;

        if (this.opConfig.batch_return === true) {
            const dataWindowKeys = buckets.keys();
            while (resultSize < this.opConfig.batch_size && this.accumulator.buckets.size !== 0) {
                const key = dataWindowKeys.next().value;
                result.push(buckets.get(key));
                resultSize += buckets.get(key).asArray().length;
                buckets.delete(key);
            }
        } else {
            for (const dataWindow of buckets.values()) {
                result.push(dataWindow);
            }
            buckets.clear();
        }

        return result;
    }
    // @ts-ignore
    onBatch(dataArray: DataEntity[]) {
        // TODO: does this work as intended?
        // on shutdown event return accumulated data
        if (dataArray.length === 0) this.accumulator.emptySlice();
        else this.accumulator.accumulate(dataArray);

        if (this.accumulator.readyToEmpty() || this.flushData) return this._batchData();

        return [];
    }
}
