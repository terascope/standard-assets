import {
    BatchProcessor, Context, DataEntity, ExecutionConfig
} from '@terascope/job-components';
import { SampleExactConfig } from './interfaces.js';

/* sample_exact.js - given an array of JSON documents will return an array containing
                a shuffled subset of those input documents.  The size of the subset will
                be the percentage multiplied against the length of the array
                rounded down.

    Example:

    This drops 20% of the incoming docs, in other words 80% of the incoming docs are returned
    ...
    {
        "_op": "sample_exact",
        "percentage": 20,
    },
    ...

    or just using the defaults:

    ...
    {
        "_op": "sample_exact"
    },
    ...

 */

export default class SampleExact extends BatchProcessor<SampleExactConfig> {
    readonly percentage: number;

    constructor(context: Context, opConfig: SampleExactConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.percentage = this.opConfig.percent_kept / 100;
    }

    async onBatch(dataArray: DataEntity[]) {
        this._shuffleArray(dataArray);
        const length = Math.floor(dataArray.length * this.percentage);
        return dataArray.slice(0, length);
    }

    /*
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     * https://stackoverflow.com/a/12646864
     */
    _shuffleArray(array: DataEntity[]) {
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }

        return array;
    }
}
