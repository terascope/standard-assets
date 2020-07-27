import {
    ConvictSchema,
    ValidatedJobConfig,
    getOpConfig,
    AnyObject,
    isNotNil,
    getTypeOf,
    isString
} from '@terascope/job-components';
import { DataGenerator, IDType, DateOptions } from './interfaces';

export default class Schema extends ConvictSchema<DataGenerator> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'data_generator');
        if (!opConfig) throw new Error('No opConfig was found for operation data_generator on the job');

        if (opConfig.id_start_key && !opConfig.set_id) {
            throw new Error('Invalid data_generator configuration, id_start_key must be used with set_id parameter, please set the missing parameters');
        }

        if (opConfig.start && opConfig.end) {
            const startingTime = new Date(opConfig.start).getTime();
            const endingTime = new Date(opConfig.end).getTime();

            if (startingTime > endingTime) throw new Error('Invalid start and end times, start must be before end');
        }
    }

    build(): AnyObject {
        return {
            json_schema: {
                doc: 'file path to custom data schema',
                default: null,
                format: 'optional_String'
            },
            size: {
                doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved '
                + 'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
                default: 5000,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid size parameter for data_generator, must be a number');
                    } else if (val <= 0) {
                        throw new Error('Invalid size parameter for data_generator, must be greater than zero');
                    }
                }
            },
            start: {
                doc: 'The start date (ISOstring or in ms) to which it will read from ',
                default: null,
                format: 'optional_Date'
            },
            end: {
                doc: 'The end date (ISOstring or in ms) to which it will read to',
                default: null,
                format: 'optional_Date'
            },
            format: {
                doc: 'This is only used with the teraslice provided schema, can elect different time structures'
                + 'such as dateNow, utcDate, utcBetween and isoBetween',
                default: null,
                format: (val: unknown): void => {
                    if (isNotNil(val)) {
                        if (isString(val)) {
                            if (!Object.values(DateOptions).includes(val as any)) throw new Error(`Invalid parameter format, must be one of these values: ${Object.values(IDType).join(',')}, but was given ${val}`);
                        } else {
                            throw new Error(`Invalid parameter format, it must be a string, was given ${getTypeOf(val)}`);
                        }
                    }
                }
            },
            stress_test: {
                doc: 'used to speed up the creation process to test load',
                default: false,
                format: Boolean
            },
            date_key: {
                doc: 'key value on schema where date should reside',
                default: 'created',
                format: String
            },
            set_id: {
                doc: 'used to make an id on the data that will be used for the doc _id, values: base64url, hexadecimal, HEXADECIMAL',
                default: null,
                format: (val: unknown): void => {
                    if (isNotNil(val)) {
                        if (isString(val)) {
                            if (!Object.values(IDType).includes(val as any)) throw new Error(`Invalid parameter set_id, must be one of these values: ${Object.values(IDType).join(',')}, but was given ${val}`);
                        } else {
                            throw new Error(`Invalid parameter set_id, it must be a string, was given ${getTypeOf(val)}`);
                        }
                    }
                }
            },
            id_start_key: {
                doc: 'set if you would like to force the first part of the ID to a certain character',
                default: null,
                format: 'optional_String'
            }
        };
    }
}
