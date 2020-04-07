import { ConvictSchema } from '@terascope/job-components';
import { PhaseConfig } from './interfaces';

export default class Schema extends ConvictSchema<PhaseConfig> {
    validate(input: any) {
        const validatedSchema = super.validate(input);
        if (!Array.isArray(input.rules) || input.rules.length === 0) throw new Error('you must specify rules path to retrive the rules for this op');
        return validatedSchema;
    }

    build() {
        return {
            rules: {
                doc: 'an array of strings that are the locations where rule files. must be specifed in "assetName:path" format',
                default: [],
            },
            plugins: {
                doc: 'an array of strings that are the locations where plugins reside. must be specifed in "assetName:modulePath" format',
                default: [],
            },
            type_config: {
                doc: 'if specified it sets describes the types on the incoming records',
                default: {}
            },
            variables: {
                doc: 'variables used in the xLucene query',
                default: {}
            }
        };
    }
}
