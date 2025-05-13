import {
    BatchProcessor, Context, DataEntity,
    ExecutionConfig, getTypeOf, isNumber, pRetry
} from '@terascope/job-components';
import { Client, SampleExactESPercentConfig } from './interfaces.js';

export default class SampleExactESPercent extends BatchProcessor<SampleExactESPercentConfig> {
    private percentage!: number;
    private esClient!: Client;
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
            return await pRetry(async () => {
                let percentToNum: number;
                const response = await this.esClient.get({ id, index });
                this.logger.trace('search GET response: ', response);

                if (!response.found || !response._source) {
                    throw new Error(`The document with id ${id} was not found in index ${index} of`
                        + ` elasticsearch-next connection ${connection}.`);
                }

                if (typeof response._source.percent === 'string') {
                    percentToNum = Number(response._source.percent);
                    if (!isNumber(percentToNum)) {
                        throw new Error('Percent could not be converted from a string to a number:'
                            + `_id: ${id}, percent: ${response._source.percent}`);
                    }
                } else if (typeof response._source.percent === 'number') {
                    percentToNum = response._source.percent;
                } else {
                    throw new Error('Expected percent to be of type number or string, '
                        + `found ${getTypeOf(response._source.percent)}. `
                        + `connection: ${connection}, index: ${index}, _id: ${id}, percent: ${response._source.percent}`);
                }

                // clamp percent to a number between 0 and 100
                const percent = Math.max(0, Math.min(100, percentToNum));
                this.logger.debug('new sample percent: ', percent);
                return percent / 100;
            });
        } catch (err) {
            if (this.percentage) {
                // If we have retrieved percentage before this error should be temporary.
                // Keep using current percentage
                this.logger.warn(`Error retrieving new percentage, will re-use current percentage: ${err}`);
                return this.percentage;
            } else {
                // Fail if initial percentage retrieval unsuccessful
                throw new Error(`SampleExactESPercentage failed to retrieve percentage from index ${index}`
                    + ` of elasticsearch-next connection ${connection}: ${err}`);
            }
        }
    }

    async shutdown(): Promise<void> {
        clearInterval(this.updatePercentKeptInterval);
        await super.shutdown();
    }
}
