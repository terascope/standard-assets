import {
    BatchProcessor, Context, DataEntity, ExecutionConfig
} from '@terascope/job-components';
import { SampleExactConfig } from './interfaces.js';

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
