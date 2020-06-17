import { DataEntity } from '@terascope/job-components';
import Accumulator from './accumulator';
import DataWindow from './data-window';
import { AccumulateByKeyConfig } from '../accumulate_by_key/interfaces';

export default class AccumulatorByKey extends Accumulator {
    buckets = new Map();
    keyField: string;
    batchReturn: boolean;
    batchSize: number;

    constructor(emptyAfter: number, config: AccumulateByKeyConfig) {
        super(emptyAfter);
        const {
            batch_size: batchSize,
            key_field: keyField,
            batch_return: batchReturn
        } = config;

        this.keyField = keyField;
        this.batchReturn = batchReturn;
        this.batchSize = batchSize;
    }

    readyToEmpty(): boolean {
        return super.readyToEmpty() && this.buckets.size > 0;
    }

    add(dataArray: DataEntity[]): void {
        this.emptySliceCount = 0;

        dataArray.forEach((doc) => {
            let key;

            if (this.keyField) key = doc[this.keyField];
            else key = doc.getMetadata('_key');

            if (key === undefined) return;

            if (Buffer.isBuffer(key)) {
                key = key.toString('utf8');
            }

            if (!this.buckets.has(key)) {
                this.buckets.set(key, DataWindow.make(key));
            }

            this.buckets.get(key).set(doc);
        });
    }

    flush(): any[] {
        const result: any[] = [];
        let resultSize = 0;
        if (this.batchReturn === true) {
            const dataWindowKeys = this.buckets.keys();
            while (resultSize < this.batchSize && this.buckets.size !== 0) {
                const key = dataWindowKeys.next().value;
                result.push(this.buckets.get(key));
                resultSize += this.buckets.get(key).asArray().length;
                this.buckets.delete(key);
            }
        } else {
            for (const dataWindow of this.buckets.values()) {
                result.push(dataWindow);
            }
            this.buckets.clear();
        }

        return result;
    }
}
