import { DataEntity, toString } from '@terascope/utils';
import * as I from './interfaces';

/**
 * A routing algorithm that uses specific field values from a
 * record (and optional the key can include the field names)
*/
export class FieldRouter implements I.Router {
    readonly kind = I.RouterKind.STORAGE;
    readonly valueDelimiter: string;
    readonly fieldDelimiter: string;
    readonly includeFieldNames: boolean;
    readonly fields: readonly string[];

    constructor(config: FieldRouterConfig) {
        this.valueDelimiter = config.value_delimiter ?? '_';
        this.fieldDelimiter = config.field_delimiter ?? '-';
        this.includeFieldNames = config.include_field_names ?? true;
        if (!config.fields?.length) {
            throw new Error('FieldRouter requires that at least one field');
        }
        this.fields = config.fields.slice();
    }

    lookup(record: DataEntity): string {
        return this.fields.map((field) => {
            const fieldData = sanitize(toString(record[field]));
            if (this.includeFieldNames === true) {
                return `${field}${this.valueDelimiter}${fieldData}`;
            }
            return fieldData;
        }).join(this.fieldDelimiter);
    }
}

function sanitize(str: string) {
    return str.replace(/[=/]/g, '_');
}

export interface FieldRouterConfig {
    /**
     * If this is true, field names will be used along with the values
     * @default true
    */
    include_field_names?: boolean;

    /**
     * This fields to use for the key, this must
     * include at least one field
    */
    fields: (readonly string[])|(string[]);

    /**
     * When generating the key, this will separate each value (and field),
     * @default '-'
    */
    field_delimiter?: string;

    /**
     * When generating the key, this will separate the field and the value,
     * @default '_'
    */
    value_delimiter?: string;
}
