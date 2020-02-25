import { DataEntity } from '@terascope/job-components';

export default class Accumulator {
    emptySliceCount = 0;
    records: DataEntity[] = [];
    emptyAfter: number;

    constructor(emptyAfter: number) {
        this.emptyAfter = emptyAfter;
    }

    add(dataArray: DataEntity[]) {
        // reset empty slice count if break in incoming data
        this.emptySliceCount = 0;
        dataArray.forEach((doc) => this.records.push(doc));
    }

    emptySlice() {
        this.emptySliceCount++;
    }

    flush() {
        const results = this.records;
        this.records = [];
        return results;
    }

    readyToEmpty() {
        return this.emptySliceCount >= this.emptyAfter;
    }

    get size() {
        return this.records.length;
    }
}
