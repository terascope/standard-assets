/* eslint-disable no-console */

import { BatchProcessor } from '@terascope/job-components';
import { StdoutConfig } from './interfaces.js';

export default class Stdout extends BatchProcessor<StdoutConfig> {
    async onBatch(data: any) {
        if (this.opConfig.limit === 0) {
            console.log(data);
        } else {
            console.log(data.slice(0, this.opConfig.limit));
        }
        return data;
    }
}
