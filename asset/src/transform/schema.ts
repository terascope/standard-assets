import {
    isString, getTypeOf, isObjectEntity
} from '@terascope/core-utils';
import { ConvictSchema, APIConfig } from '@terascope/job-components';
import { PhaseConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<PhaseConfig> {
    validate(input: PhaseConfig): APIConfig & PhaseConfig {
        const validatedSchema = super.validate(input);
        if (!Array.isArray(input.rules) || input.rules.length === 0) throw new Error('you must specify rules path to retrieve the rules for this op');
        return validatedSchema;
    }

    build(): Record<string, any> {
        return {
            rules: {
                doc: 'an array of strings that are the locations where rule files. must be specified in "assetName:path" format',
                default: [],
                format: (val: unknown): void => {
                    if (Array.isArray(val)) {
                        if (val.length === 0 || !val.every(isString)) throw new Error('Invalid parameter rules, it needs to be an array of strings which are paths to the rule files');
                    } else {
                        throw new Error(`Invalid parameter rules, it needs to be an array of strings, got ${getTypeOf(val)}`);
                    }
                }
            },
            plugins: {
                doc: 'an array of strings that are the locations where plugins reside. must be specified in "assetName:modulePath" format',
                default: [],
                format: (val: unknown): void => {
                    if (Array.isArray(val)) {
                        if (!val.every(isString)) throw new Error('Invalid parameter plugins, it needs to be an array of strings');
                    } else {
                        throw new Error(`Invalid parameter plugins, it needs to be an array of strings, got ${getTypeOf(val)}`);
                    }
                }
            },
            type_config: {
                doc: 'if specified it sets describes the types on the incoming records',
                default: {},
                format: (val: unknown): void => {
                    if (!isObjectEntity(val)) throw new Error(`Invalid parameter type_config, it must be an object, got ${getTypeOf(val)}`);
                }
            },
            variables: {
                doc: 'variables used in the xLucene query',
                default: {},
                format: (val: unknown): void => {
                    if (!isObjectEntity(val)) throw new Error(`Invalid parameter variables, it must be an object, got ${getTypeOf(val)}`);
                }
            }
        };
    }
}
