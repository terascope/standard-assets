
import { DataEntity } from '@terascope/job-components';

export default class Accumulator {
    emptySliceCount = 0;
    records: DataEntity[] = [];
    emptyAfter: number;

    constructor(emptyAfter: number) {
        this.emptyAfter = emptyAfter;
    }

    accumulate(dataArray: DataEntity[]) {
        // reset empty slice count if break in incoming data
        this.emptySliceCount = 0;
        dataArray.forEach((doc) => this.records.push(doc));
    }

    emptySlice() {
        this.emptySliceCount++;
    }

    readyToEmpty() {
        return this.emptySliceCount >= this.emptyAfter;
    }
}
