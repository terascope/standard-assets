import { get, isKey } from '@terascope/core-utils';
import { Slicer, SlicerRecoveryData } from '@terascope/job-components';
import { DataGenerator, CounterResults } from './interfaces.js';
import Counter from './counter.js';

export default class DataGeneratorSlicer extends Slicer<DataGenerator> {
    countHandle!: () => Promise<CounterResults>;

    async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
        await super.initialize(recoveryData);

        const { size } = this.opConfig;
        const { lifecycle, operations, apis } = this.executionConfig;
        const isPersistent = lifecycle === 'persistent';
        let alreadyProcessed: undefined | number;

        if (this.recoveryData) {
            alreadyProcessed = get(this.recoveryData[0], 'lastSlice.processed', 0);
        }

        let lastOpSize;
        const opListSize = operations.length - 1;
        const lastOpApiName = operations[opListSize]._api_name;
        if (lastOpApiName !== undefined) {
            const lastOpApi = apis.filter((api) => api._name = lastOpApiName)[0];
            if (isKey(lastOpApi, 'size')) {
                lastOpSize = lastOpApi.size;
            }
        }

        const counter = new Counter(isPersistent, size, lastOpSize, alreadyProcessed);
        this.countHandle = counter.handle;
    }

    maxQueueLength(): number {
        return this.workersConnected * 3;
    }

    isRecoverable(): boolean {
        return true;
    }

    async slice(): Promise<CounterResults> {
        return this.countHandle();
    }
}
