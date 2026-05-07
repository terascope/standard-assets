import { hasOwn, isEmpty } from '@terascope/core-utils';
import { DataTypeConfigWithGeneratorOpts } from '../modes/data-type.js';
import { makeRandomDataFunctionForField } from './makeField.js';

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

    const fns: Record<string, () => any> = {};

    for (const field in fields) {
        if (hasOwn(fields, field)) {
            const config = fields[field];
            fns[field] = makeRandomDataFunctionForField(config, field);
        }
    }

    const makeField = () => {
        const record: any = {};
        for (const key in fns) {
            if (!Object.hasOwn(fns, key)) continue;
            record[key] = fns[key]();
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
