import { Fetcher, Context } from '@terascope/job-components';
import { DataTypeConfig, ExecutionConfig } from '@terascope/types';
import { Mocker } from 'mocker-data-generator';
import { faker } from '@faker-js/faker';
import Randexp from 'randexp';
import Chance from 'chance';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { pDelay, TSError } from '@terascope/core-utils';
import { DataGenerator, CounterResults } from './interfaces.js';
import defaultSchema from './data-schema.js';
import defaultDataType from './data-type.js';

/**
 * FIXME - this will change to a @terascope/data-types import once updated & merged
 */
import { makeRandomDataSet } from './deleteme.js';

const chance = new Chance();

export default class DataGeneratorFetcher extends Fetcher<DataGenerator> {
    dataSchema: Record<string, any> | undefined;
    dataTypeConfig: DataTypeConfig | undefined;
    private fetchFn: (count: number) => Promise<Record<string, any>[]>;

    constructor(context: Context, opConfig: DataGenerator, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);

        const mode = opConfig.mode || 'json_schema';

        if (mode === 'json_schema') {
            this.dataSchema = parsedSchema(opConfig);
            this.fetchFn = this.bySchema;
        } else {
            this.dataTypeConfig = parsedDataTypeConfig(opConfig);
            this.fetchFn = this.byDataType;
        }
    }

    async fetch(slice?: CounterResults): Promise<Record<string, any>[]> {
        if (slice == null) return [];

        if (this.opConfig.stress_test) {
            return this.fetchFn(slice.count);
        }

        // default is zero
        if (this.opConfig.delay > 0) {
            const secondsToMilliseconds = this.opConfig.delay * 1000;
            await pDelay(secondsToMilliseconds);
        }

        return this.fetchFn(slice.count);
    }

    private async byDataType(count: number) {
        if (!this.dataTypeConfig?.fields) throw new Error('Invalid Data Generator config - missing data type config');

        return makeRandomDataSet(
            this.dataTypeConfig.fields,
            count,
            this.opConfig.stress_test
        ) || [];
    }

    private async bySchema(count: number) {
        if (!this.dataSchema) throw new Error('Invalid Data Generator config - missing schema');

        const mocker = new Mocker();
        return mocker
            .addGenerator('faker', faker)
            .addGenerator('chance', chance)
            .addGenerator('randexp', Randexp, (Generator, input) => new Generator(input).gen())
            .schema('schema', this.dataSchema, this.opConfig.stress_test ? 1 : count)
            .build()
            .then((dataObj) => {
                if (this.opConfig.stress_test) {
                    const results = [];
                    const data = dataObj.schema[0];
                    for (let i = 0; i < count; i += 1) {
                        results.push(data);
                    }
                    return results;
                }
                return dataObj.schema;
            })
            .catch((err) => Promise.reject(new TSError(err, { reason: 'could not generate mocked data' })));
    }
}

function parsedSchema(opConfig: DataGenerator) {
    let dataSchema = {};
    if (opConfig.json_schema) {
        const firstPath = opConfig.json_schema;
        const nextPath = path.join(process.cwd(), opConfig.json_schema);

        try {
            if (existsSync(firstPath)) {
                dataSchema = import(firstPath);
            } else {
                dataSchema = import(nextPath);
            }
            return dataSchema;
        } catch (err) {
            throw new TSError(err, { reason: `Could not retrieve code for: ${opConfig._op}` });
        }
    } else {
        return defaultSchema(opConfig, dataSchema);
    }
}

function parsedDataTypeConfig(opConfig: DataGenerator): DataTypeConfig {
    if (opConfig.data_type_config) {
        return opConfig.data_type_config;
    } else {
        return defaultDataType(opConfig);
    }
}
