import { DataEntity } from '@terascope/job-components';

export default class Accumulator {
    emptySliceCount = 0;
    records: DataEntity[] = [];
    emptyAfter: number;

    constructor(emptyAfter: number) {
        this.emptyAfter = emptyAfter;
    }

    add(dataArray: DataEntity[]): void {
        // reset empty slice count if break in incoming data
        this.emptySliceCount = 0;
        this.records.push(...dataArray);
    }

    emptySlice(): void {
        this.emptySliceCount++;
    }

    flush(): DataEntity[] {
        const results = this.records;
        this.records = [];
        return results;
    }

    readyToEmpty(): boolean {
        return this.emptySliceCount >= this.emptyAfter;
    }

    get size(): number {
        return this.records.length;
    }
}
