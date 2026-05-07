import { hasOwn, isEmpty } from '@terascope/core-utils';
import { DataTypeConfigWithGeneratorOpts, FieldOptions } from '../modes/data-type.js';
import { makeRandomDataFunctionForField } from './makeField.js';
import { getChildDataTypeConfig } from '@terascope/data-mate';
import { DataTypeFieldConfig, DataTypeFields, FieldType } from '@terascope/types';

type DataTypeFieldConfigWithOpts = DataTypeConfigWithGeneratorOpts['fields']['config'];
type FieldConfigWithChildren = {
    config: DataTypeFieldConfig & FieldOptions;
    childFields: DataTypeFields;
};

/**
 * Generates an array of records based on the data type field config of count
 * NOTE: "locale" not implemented
 */
export function makeRandomDataSet(
    fields: DataTypeConfigWithGeneratorOpts['fields'],
    total = 3,
    isStressTest = false
): Record<string, any>[] | undefined {
    if (isEmpty(fields)) return;

    const { fns, fieldChildren } = collectFieldFnsAndChildren(fields);

    const makeField = () => {
        const record: any = {};
        for (const key in fns) {
            if (!Object.hasOwn(fns, key)) continue;
            record[key] = fns[key]();
        }

        if (fieldChildren) {
            for (const field in fieldChildren) {
                if (!Object.hasOwn(fieldChildren, field)) continue;

                const childFields = fieldChildren[field];
                for (const child of childFields) {
                    record[`${field}.${child}`] = record[field]?.[child];
                }
            }
        }

        return record;
    };

    const stressTestRecord = isStressTest
        ? makeField()
        : undefined;

    const records: Record<string, any>[] = [];
    for (let i = 0; i < total; i++) {
        records.push(stressTestRecord || makeField());
    }

    return records;
}

/**
 * Loops through fields, creating functions to generate data,
 * as well as children to populate via their parent
 */
function collectFieldFnsAndChildren(fields: DataTypeConfigWithGeneratorOpts['fields']) {
    const fns: Record<string, () => any> = {};
    const fieldsWithChildren: Record<string, FieldConfigWithChildren> = {};
    const possibleChild: Record<string, DataTypeFieldConfigWithOpts> = {};
    const fieldChildren: Record<string, string[]> = {};

    /**
     * loop thru fields, collecting fn's (unless field has children)
     */
    for (const field in fields) {
        if (hasOwn(fields, field)) {
            const config = fields[field];

            if (field.includes('.')) {
                possibleChild[field] = config;
            }

            const childFields = getChildDataTypeConfig(fields, field, config.type as FieldType);
            if (childFields) {
                fieldsWithChildren[field] = { config, childFields };
            } else {
                fns[field] = makeRandomDataFunctionForField(config, field);
            }
        }
    }

    /**
     * Loop thru fields w/children & create fn's for them,
     * if other field in data type has child (via dot notation)
     * - merge child config options
     * - delete that field's fn and denote to populate after root object is created
     */
    for (const field in fieldsWithChildren) {
        if (!Object.hasOwn(fieldsWithChildren, field)) continue;

        const config = fieldsWithChildren[field].config;
        const childFields = fieldsWithChildren[field].childFields;

        for (const child in childFields) {
            if (!Object.hasOwn(childFields, child)) continue;

            if (possibleChild[`${field}.${child}`]) {
                // merge found field config w/child config
                childFields[child] = {
                    ...childFields[child],
                    ...possibleChild[child]
                };

                // delete child fn & will assign value after parent obj is created
                delete fns[`${field}.${child}`];
                fieldChildren[field] ??= [];
                fieldChildren[field].push(child);
            }
        }

        // fn will create the field w/child fields
        fns[field] = makeRandomDataFunctionForField(config, field, childFields);
    }

    return { fns, fieldChildren };
}
