import { BatchProcessor, DataEntity, random } from '@terascope/job-components';
import { SampleRandomConfig } from './interfaces.js';

/* sample.js - given an array of JSON documents will return an array containing
                a subset of those input documents.  It iterates through the array
                and generates a random number between 0 and 100 for each record, and if the
                number <= probability it is kept. Must be between 0 and 100,
                with 100 keeping all records and 0 rejecting all records.

    Example:

    Each doc has a 20% to be returned
    ...
    {
        "_op": "sample_random",
        "probability_to_keep": 20,
    },
    ...

    or just using the defaults:

    ...
    {
        "_op": "sample_random"
    },
    ...

 */

export default class SampleRandom extends BatchProcessor<SampleRandomConfig> {
    async onBatch(dataArray: DataEntity[]) {
        const outData: DataEntity[] = [];

        for (const doc of dataArray) {
            if (random(0, 99) <= this.opConfig.probability_to_keep) {
                outData.push(doc);
            }
        }

        return outData;
    }
}
