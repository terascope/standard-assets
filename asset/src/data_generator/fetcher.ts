import {
    Fetcher, Context, TSError, AnyObject, pDelay
} from '@terascope/job-components';
import { ExecutionConfig } from '@terascope/types';
import { Mocker } from 'mocker-data-generator';
import { faker } from '@faker-js/faker';
import Randexp from 'randexp';
import Chance from 'chance';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { DataGenerator, CounterResults } from './interfaces.js';
import defaultSchema from './data-schema.js';

const chance = new Chance();
export default class DataGeneratorFetcher extends Fetcher<DataGenerator> {
    dataSchema: AnyObject;

    constructor(context: Context, opConfig: DataGenerator, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.dataSchema = parsedSchema(opConfig);
    }

    async fetch(slice?: CounterResults): Promise<AnyObject[]> {
        const mocker = new Mocker();
        if (slice == null) return [];
        const { count } = slice;
        if (this.opConfig.stress_test) {
            return mocker
                .addGenerator('faker', faker)
                .addGenerator('chance', chance)
                .addGenerator('randexp', Randexp, (Generator, input) => new Generator(input).gen())
                .schema('schema', this.dataSchema, 1)
                .build()
                .then((dataObj) => {
                    const results = [];
                    const data = dataObj.schema[0];
                    for (let i = 0; i < count; i += 1) {
                        results.push(data);
                    }
                    return results;
                })
                .catch((err) => Promise.reject(new TSError(err, { reason: 'could not generate mocked data' })));
        }
        // default is zero which is falsy
        if (this.opConfig.delay) {
            // convert rate value from seconds to milliseconds
            const time = this.opConfig.delay * (1000);
            await pDelay(time);
        }
        return mocker
            .addGenerator('faker', faker)
            .addGenerator('chance', chance)
            .addGenerator('randexp', Randexp, (Generator, input) => new Generator(input).gen())
            .schema('schema', this.dataSchema, count)
            .build()
            .then((dataObj) => dataObj.schema)
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
