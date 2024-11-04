import {
    FilterProcessor, Context, ExecutionConfig,
    DataEntity, get, toCamelCase
} from '@terascope/job-components';
import { FieldValidator } from '@terascope/data-mate';
import { FilterConfig, ExceptionRule } from './interfaces.js';
/*
    Drops docs if the field value meets the criteria provided by filter_by, field, and value.
    Filter_by field can be a strict match, regex match, or within an ip range using cidr notation.
    If invert is true then processor returns objects whose value meets the criteria.
    Criteria value can be a single item or an array of items.

    Example:
    ...
    {
        "_op": "filter",
        "field": "field name",
        "value": "value",
        "invert": true,
        "type": "match"
    },
    ...
 */

export default class Filter extends FilterProcessor<FilterConfig> {
    functionName: string;
    filterValue: any[];
    exception_rules?: ExceptionRule[];

    constructor(context: Context, opConfig: FilterConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);

        this.functionName = toCamelCase(this.opConfig.filter_by);
        this.filterValue = this._filterValueToArray();

        // convert regexps on start up
        if (this.opConfig.exception_rules) {
            this.exception_rules = this._updateRegexRules();
        }
    }

    filter(doc: DataEntity) {
        if (this.exception_rules && this._exceptionCheck(doc)) return true;

        const result = this._criteriaCheck(this._getDocValue(doc));

        const keep = this.opConfig.invert === true ? result : !result;

        if (this.opConfig.drop_to_dlq && keep === false) {
            const err = new Error('Record was rejected');
            this.rejectRecord(doc, err);
        }

        return keep;
    }

    _criteriaCheck(docValue: any | any[]) {
        if (Array.isArray(docValue)) {
            return docValue.some((value) => this._compareValues(value));
        }

        return this._compareValues(docValue);
    }

    _getDocValue(doc: DataEntity) {
        if (Array.isArray(this.opConfig.field)) {
            return this.opConfig.field.map((f) => get(doc, f));
        }

        if (this.functionName === 'size') {
            if (this.opConfig.field === 'doc') {
                return this._getSize(doc);
            }

            return this._getSize(doc[this.opConfig.field]);
        }

        if (this.opConfig.array_index > -1) {
            if (Array.isArray(doc[this.opConfig.field])) {
                return doc[this.opConfig.field][this.opConfig.array_index];
            }

            return undefined;
        }

        return get(doc, this.opConfig.field);
    }

    _filterValueToArray() {
        if (Array.isArray(this.opConfig.value)) {
            return this.opConfig.value;
        }

        return [this.opConfig.value];
    }

    _compareValues(docValue: any) {
        return this.filterValue.some(
            // @ts-expect-error
            (filter) => this[this.functionName](docValue, filter)
        );
    }

    match(docValue: any, filterValue: any) {
        return docValue === filterValue;
    }

    regex(docValue: any, filterValue: any) {
        const reg = new RegExp(filterValue, this.opConfig.regex_flags);
        return reg.test(docValue);
    }

    ipRange(docValue: string, filterValue: string) {
        return FieldValidator.inIPRange(docValue, {}, { cidr: filterValue });
    }

    validator(docValue: any) {
        const fn = get(FieldValidator, this.opConfig.data_mate_function as string);
        return fn(docValue, {}, this.opConfig.data_mate_args);
    }

    size(sizeValue: number) {
        return sizeValue > this.opConfig.value;
    }

    _getSize(doc: any) {
        // TODO: what about symbol and bigint ??
        const typeSizes = {
            undefined: () => 0,
            boolean: () => 4,
            number: () => 8,
            bigint: () => 8,
            string: (item: string) => 2 * item.length,
            object: (item: Record<string, any>): number => {
                if (item == null) return 0;

                return Object.keys(item).reduce(
                    (total, key) => total + this._getSize(key) + this._getSize(item[key]), 0
                );
            }
        };
        // TODO: what about symbol and bigint ??
        const type = get(typeSizes, typeof doc, () => 0);
        return type(doc);
    }

    _exceptionCheck(doc: DataEntity) {
        return this.exception_rules!.some((rule) => this._runExceptionRule(doc, rule));
    }

    _runExceptionRule(doc: Record<string, any>, { field, value, regex }: ExceptionRule) {
        const checkValue = doc[field];

        if (checkValue == null) return false;

        if (regex) return this._checkRegex(checkValue, value as RegExp);

        return checkValue === value;
    }

    _checkRegex(checkValue: string, value: RegExp) {
        return checkValue.match(value) != null;
    }

    _updateRegexRules() {
        return this.opConfig.exception_rules!.map((rule) => {
            const { field, value, regex } = rule;

            if (regex) {
                return { field, value: this._toRegex(value as string), regex };
            }

            return rule;
        });
    }

    _toRegex(value: string) {
        const lastFwdSlash = value.lastIndexOf('/');

        const flags = value.slice(lastFwdSlash + 1);

        try {
            return new RegExp(value.slice(1, lastFwdSlash), flags);
        } catch (e) {
            throw new Error(`could not convert ${value} to regex, ${e}`);
        }
    }
}
