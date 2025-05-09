import {
    ConvictSchema, isNumber, isString
} from '@terascope/job-components';
import { SampleExactESPercentConfig } from './interfaces.js';

export default class SampleExactESPercentSchema extends ConvictSchema<SampleExactESPercentConfig> {
    build() {
        return {
            connection: {
                doc: 'Name of the elasticsearch connection to use to find index size.',
                default: 'default',
                format: 'optional_String'
            },
            index: {
                doc: 'Name of the index that holds the percentage document - required',
                default: null,
                format(val: unknown): void {
                    if (!isString(val)) throw new Error('must be of type string');
                    if (val.length === 0) throw new Error('must not be an empty string');
                    if (val.match(/[A-Z]/)) throw new Error('must be lowercase');
                }
            },
            document_id: {
                doc: '_id of the document holding the percentage of docs to keep - required',
                default: null,
                required: true,
                format(val: unknown) {
                    if (typeof val !== 'string' || val.trim().length === 0) {
                        throw new Error('must be a non-empty string');
                    }
                }
            },
            window_ms: {
                doc: 'The time in milliseconds between queries to elasticsearch (Default: 300_000ms (5 minutes))',
                default: 300_000,
                format(val: unknown) {
                    if (!isNumber(val) || (val < 100) || (val > 3_600_000)) {
                        throw new Error('must be a number between 100 and 3,600,000 milliseconds (1 hour).');
                    }
                },
            }
        };
    }
}
