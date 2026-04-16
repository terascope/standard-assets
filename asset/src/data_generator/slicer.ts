import { get } from '@terascope/core-utils';
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

        let sliceSize: undefined | number = undefined;
        const opListSize = operations.length - 1;
        const lastOp = operations[opListSize];

        if (lastOp.size) {
            sliceSize = lastOp.size;
        } else {
            const lastOpApiName = lastOp._api_name;
            if (lastOpApiName) {
                const lastOpApi = apis.find((api) => api._name = lastOpApiName);
                sliceSize = lastOpApi?.size;
            }
        }

        if (!sliceSize) {
            sliceSize = size;
        }

        const counter = new Counter(isPersistent, size, sliceSize, alreadyProcessed);
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
