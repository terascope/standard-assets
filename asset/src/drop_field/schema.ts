import { ConvictSchema } from '@terascope/job-components';
import { DateRouterConfig } from '@terascope/standard-asset-apis';
import { isString } from '@terascope/utils';

export default class Schema extends ConvictSchema<DateRouterConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Field to remove from incoming document',
                default: null,
                format: (value: unknown) => {
                    if (value == null) {
                        throwError(value);
                    }

                    if (Array.isArray(value)) {
                        if (!value.every((i) => isString(i))) {
                            throwError(value);
                        }

                        return;
                    }

                    if (!isString(value)) throwError(value);
                }
            }
        };
    }
}

function throwError(value: unknown) {
    throw new Error(`Field must be a string or an array of string, received ${value}`);
}
