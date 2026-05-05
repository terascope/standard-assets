import { getTypeOf, isNotNil, isSimpleObject, isString } from '@terascope/core-utils';
import { BaseSchema, ValidatedJobConfig, getOpConfig } from '@terascope/job-components';
import { DataGenerator, IDType, DateOptions } from './interfaces.js';
import { DataTypeFieldConfig, FieldType, Terafoundation } from '@terascope/types';

export default class Schema extends BaseSchema<DataGenerator> {
    validateJob(job: ValidatedJobConfig): void {
        const opConfig = getOpConfig(job, 'data_generator');
        if (!opConfig) throw new Error('No opConfig was found for operation data_generator on the job');

        if (opConfig.id_start_key && !opConfig.set_id) {
            throw new Error('Invalid data_generator configuration, id_start_key must be used with set_id parameter, please set the missing parameters');
        }

        if (opConfig.stress_test && opConfig.delay !== 0) {
            throw new Error('Invalid data_generator configuration, setting "delay" while "stress_test" is true is not permitted.');
        }

        if (opConfig.start && opConfig.end) {
            const startingTime = new Date(opConfig.start).getTime();
            const endingTime = new Date(opConfig.end).getTime();

            if (startingTime > endingTime) throw new Error('Invalid start and end times, start must be before end');
        }
    }

    build(): Terafoundation.Schema<Omit<DataGenerator, '_op'>> {
        return {
            json_schema: {
                doc: 'File path to custom data schema',
                default: null,
                format: 'optional_string'
            },
            data_type_fields: {
                doc: 'Data type fields to use instead of a json schema ({ field1: { type, etc. }, field2: { type, etc. } })',
                default: null,
                format(val: any) {
                    if (val) {
                        if (!isSimpleObject) {
                            throw new Error('Invalid data type fields parameter for data_generator, must be an object of fields & field configurations');
                        }
                        for (const field in val) {
                            if (!Object.hasOwn(val, field)) continue;

                            const config = val[field] as DataTypeFieldConfig;

                            if (!config.type || !FieldType[config.type]) {
                                throw new Error(`Field "${field}" must have a valid field type`);
                            }
                        }
                    }
                }
            },
            mode: {
                doc: 'Whether to use the traditional json_schema or data_type mode',
                default: 'json_schema',
                format: 'optional_string'
            },
            size: {
                doc: 'If job `lifecycle` is set to `once`, then size is the total number of generated documents. '
                    + 'If job `lifecycle` is set to `persistent` and if the sender operation and api do not specify '
                    + 'a size, then the generator will constantly stream data in chunks equal to the size.',
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
                doc: 'The start date (ISOString or in ms) to which it will read from ',
                default: null,
                format: 'optional_date'
            },
            end: {
                doc: 'The end date (ISOString or in ms) to which it will read to',
                default: null,
                format: 'optional_date'
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
            delay: {
                doc: 'Time in seconds that a worker will delay the completion of a slice. Great'
                    + 'for generating controlled amounts of data within a loose time window.',
                default: 0,
                format(val: any) {
                    if (isNaN(val)) {
                        throw new Error('Invalid rate parameter for data_generator, must be a number');
                    } else if (val < 0) {
                        throw new Error('Invalid rate parameter for data_generator, must not be negative');
                    }
                }
            },
            date_key: {
                doc: 'key value on schema where date should reside',
                default: 'created',
                format: String
            },
            set_id: {
                doc: 'used to make an id on the data that will be used for the doc _key, values: base64url, hexadecimal, HEXADECIMAL',
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
                format: 'optional_string'
            }
        };
    }
}
