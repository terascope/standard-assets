"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Accumulator {
    constructor(emptyAfter) {
        this.emptySliceCount = 0;
        this.records = [];
        this.emptyAfter = emptyAfter;
    }
    accumulate(dataArray) {
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
exports.default = Accumulator;
//# sourceMappingURL=accumulator.js.map