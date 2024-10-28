import { BatchProcessor, DataEntity, random } from '@terascope/job-components';
import { DropDocConfig } from './interfaces.js';

/* dropdoc.js - given an array of JSON documents will return an array containing
                a subset of those input documents.  The size of the subset will
                be approximately 100 - the amount specified by the config.
                The percentage will be better with a larger number of input
                documents.

    Example:

    This drops 20% of the incoming docs, in other words 80% of the incoming docs are returned
    ...
    {
        "_op": "dropdoc",
        "percentage": 20,
        "shuffle": true
    },
    ...

    or just using the defaults:

    ...
    {
    "_op": "dropdoc"
    },
    ...

 */

export default class DropDoc extends BatchProcessor<DropDocConfig> {
    async onBatch(dataArray:DataEntity[]) {
        const outData: DataEntity[] = [];

        for (const doc of dataArray) {
            if (random(0, 99) >= this.opConfig.percentage) {
                outData.push(doc);
            }
        }

        if (this.opConfig.shuffle) {
            this._shuffleArray(outData);
        }

        return outData;
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
