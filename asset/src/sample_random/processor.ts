import { BatchProcessor, DataEntity, random } from '@terascope/job-components';
import { SampleRandomConfig } from './interfaces.js';

export default class SampleRandom extends BatchProcessor<SampleRandomConfig> {
    async onBatch(dataArray: DataEntity[]) {
        const outData: DataEntity[] = [];

        for (const doc of dataArray) {
            if (random(1, 100) <= this.opConfig.probability_to_keep) {
                outData.push(doc);
            }
        }

        return outData;
    }
}
