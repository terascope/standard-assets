
import { DataEntity } from '@terascope/job-components';
import Accumulator from './accumulator';
import DataWindow from './data-window';

export default class AccumulatorByKey extends Accumulator {
    buckets = new Map();
    keyField: string;

    constructor(emptyAfter: number, keyField: string) {
        super(emptyAfter);
        this.keyField = keyField;
    }

    readyToEmpty() {
        return super.readyToEmpty() && this.buckets.size > 0;
    }

    accumulate(dataArray: DataEntity[]) {
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
}
