import { ConvictSchema, OpConfig, APIConfig } from '@terascope/job-components';
import { FieldValidator } from '@terascope/data-mate';

export default class Schema extends ConvictSchema<OpConfig> {
    validate(config: OpConfig & APIConfig): OpConfig & APIConfig {
        if (config.regex == null && config.validation_method == null) {
            throw new Error('Config must have a regex or validation_method');
        }

        if (config.regex != null && config.validation_method != null) {
            throw new Error('Must choose either a regex or validation method, cannot use both');
        }

        if (config.regex && config.validation_method == null) {
            const regExp = config.regex;

            if (!FieldValidator.isString(config.regex)) {
                throw new Error(`Regex must be a string value is ${regExp}`);
            }

            const firstChar = regExp[0];
            const lastFwdSlash = regExp.lastIndexOf('/');

            if (firstChar !== '/' || lastFwdSlash <= 0) {
                throw new Error(`regex must be in formate of /REGEX/Flags, received ${regExp}`);
            }

            const validFlags = ['d', 'g', 'i', 'm', 's', 'u', 'y'];

            regExp.slice(lastFwdSlash + 1).split('').forEach((f: string) => {
                if (!validFlags.includes(f)) {
                    throw new Error(`Acceptable regex flags are ${validFlags.join(' or ')}, received ${f}`);
                }
            });
        }

        return config;
    }

    build(): Record<string, any> {
        return {
            field: {
                doc: 'Field to remove from incoming document',
                default: null,
                format: 'required_String'
            },
            regex: {
                doc: 'Regular Expression to compare field value with',
                default: null,
                format: '*'
            },
            validation_method: {
                doc: 'FieldValidator method to use to validate field value',
                default: null,
                format: '*'
            },
            validation_args: {
                doc: 'Args for regex and validation method',
                default: null,
                format: '*'
            },
            invert: {
                doc: 'Keeps fields whose value returns true from the regex of validation method',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
