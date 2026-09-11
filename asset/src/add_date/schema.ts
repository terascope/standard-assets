import { BaseSchema } from '@terascope/job-components';
import { formatDateValue } from '@terascope/core-utils';
import { DateFormat } from '@terascope/types';
import { AddDateConfig } from './interfaces.js';

export default class Schema extends BaseSchema<AddDateConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Name of the field that the date is written to',
                default: null,
                format: 'required_string'
            },
            format: {
                doc: `Output format of the date, either a DateFormat (${Object.keys(DateFormat).join(', ')}) or a date-fns format string`,
                default: DateFormat.iso_8601,
                format: (value: unknown) => {
                    if (typeof value !== 'string' || value === '') {
                        throw new Error('format must be a non-empty string');
                    }

                    if (value in DateFormat) {
                        return;
                    }

                    try {
                        formatDateValue(Date.now(), value);
                    } catch (err) {
                        throw new Error(`format "${value}" is not a valid DateFormat or date-fns format string`);
                    }
                }
            },
            overwrite: {
                doc: 'Sets the field even if it is already on the document',
                default: false,
                format: 'Boolean'
            }
        };
    }
}
