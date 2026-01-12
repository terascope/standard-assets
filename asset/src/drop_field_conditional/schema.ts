import { BaseSchema, OpConfig, APIConfig } from '@terascope/job-components';
import { isObjectEntity } from '@terascope/core-utils';
import { FieldValidator } from '@terascope/data-mate';

export default class Schema extends BaseSchema<OpConfig> {
    validate(config: OpConfig & APIConfig): OpConfig & APIConfig {
        const {
            regex,
            validation_method: validationMethod,
            validation_args: args
        } = config;

        if (regex == null && validationMethod == null) {
            throw new Error('Config must have a regex or validation_method');
        }

        if (regex != null && validationMethod != null) {
            throw new Error('Must choose either a regex or validation method, cannot use both');
        }

        if (validationMethod == null && args != null) {
            throw new Error('Must have a validation method if validation_args are present');
        }

        if (regex) {
            if (!FieldValidator.isString(regex)) {
                throw new Error(`Regex must be a string value received ${regex}`);
            }

            const firstChar = regex[0];
            const lastFwdSlash = regex.lastIndexOf('/');

            if (firstChar !== '/' || lastFwdSlash <= 0) {
                throw new Error(`regex must be in formate of /REGEX/Flags, received ${regex}`);
            }

            const validFlags = ['d', 'g', 'i', 'm', 's', 'u', 'y'];

            regex.slice(lastFwdSlash + 1).split('')
                .forEach((f: string) => {
                    if (!validFlags.includes(f)) {
                        throw new Error(`Acceptable regex flags are ${validFlags.join(' or ')}, received ${f}`);
                    }
                });
        }

        if (validationMethod) {
            const validationMethods = Object.keys(FieldValidator);

            if (!validationMethods.includes(validationMethod)) {
                throw new Error(`${validationMethod} is not a valid function, only FieldValidation methods from data-mate are valid`);
            }

            if (args && !isObjectEntity(args)) {
                throw new Error(`Validation args must be an object, received ${args}`);
            }
        }

        return config;
    }

    build(): Record<string, any> {
        return {
            field: {
                doc: 'Field to remove from incoming document',
                default: null,
                format: 'required_string'
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
                doc: 'Args validation method',
                default: null,
                format: '*'
            },
            invert: {
                doc: 'Keeps fields whose value returns true from the regex or validation method',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
