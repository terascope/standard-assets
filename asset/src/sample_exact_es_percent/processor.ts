import {
    BatchProcessor, Context, DataEntity,
    ExecutionConfig, pRetry
} from '@terascope/job-components';
import { SampleExactESPercentConfig } from './interfaces.js';

// fixme rename
export default class SampleExactESPercent extends BatchProcessor<SampleExactESPercentConfig> {
    private percentage!: number;
    private esClient: any;
    private updatePercentKeptInterval: NodeJS.Timeout | undefined;

    constructor(context: Context, opConfig: SampleExactESPercentConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
    }

    async initialize(): Promise<void> {
        this.esClient = (await this.context.apis.foundation.createClient({
            type: 'elasticsearch-next',
            endpoint: this.opConfig.connection
        })).client;

        this.percentage = await this._getNewPercentKept();

        this.updatePercentKeptInterval = setInterval(async () => {
            this.percentage = await this._getNewPercentKept();
        }, this.opConfig.window_ms);
    }

    async onBatch(dataArray: DataEntity[]) {
        this._shuffleArray(dataArray);
        const length = Math.floor(dataArray.length * this.percentage);
        this.logger.info(`Keeping ${length} record sample size of ${dataArray.length} original records (${this.percentage * 100}%)`);

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

    /*
     * Retrieves the elasticsearch record specified in the opConfig,
     * gets the value from the percent field (should be between 0 and 100)
     * and returns the decimal percentage of records to keep(clamped between 0 and 1).
    */
    private async _getNewPercentKept(): Promise<number> {
        const { document_id: id, index, connection } = this.opConfig;
        try {
            return pRetry(async () => {
                const response = await this.esClient.get({ id, index });
                this.logger.trace('search GET response: ', response);
                // clamp percent to a number between 0 and 100
                const percent = Math.max(0, Math.min(100, response._source.percent));
                this.logger.debug('new sample percent: ', percent);

                return percent / 100;
            });
        } catch (err) {
            if (this.percentage) {
                this.logger.warn(`Error retrieving new percentage, will re-use current percentage: ${err}`);
                return this.percentage;
            } else {
                throw new Error(`SampleExactESPercentage failed to retrieve percentage from index ${index} of elasticsearch-next connection ${connection}.`);
            }
        }
    }

    async shutdown(): Promise<void> {
        clearInterval(this.updatePercentKeptInterval);
        await super.shutdown();
    }
}
