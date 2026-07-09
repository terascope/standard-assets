import {
    DataEntity, isValidDate, getTime, isISO8601
} from '@terascope/core-utils';
import {
    FilterProcessor, Context, ExecutionConfig, isPromAvailable
} from '@terascope/job-components';
import ms from 'ms';
import { FilterByDateConfig } from './interfaces.js';

enum DateDirection {
    past = 'past',
    future = 'future'
}

export default class FilterByDate extends FilterProcessor<FilterByDateConfig> {
    static rejects: number = 0;
    private limit_past: number;
    private limit_future: number;
    // a date value is a comparison against a static set date, while the
    // other (ie 1Day) is a moving date comparison during the life of the job
    private is_precise_past_date = false;
    private is_precise_future_date = false;

    constructor(context: Context, opConfig: FilterByDateConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);

        if (isISO8601(this.opConfig.limit_past)) {
            this.limit_past = new Date(this.opConfig.limit_past).getTime();
            this.is_precise_past_date = true;
        } else {
            this.limit_past = ms(this.opConfig.limit_past as string);
        }

        if (isISO8601(this.opConfig.limit_future)) {
            this.limit_future = new Date(this.opConfig.limit_future).getTime();
            this.is_precise_future_date = true;
        } else {
            this.limit_future = ms(this.opConfig.limit_future as string);
        }
    }

    async initialize(): Promise<void> {
        const { opConfig, context } = this;

        if (opConfig.collect_metrics && isPromAvailable(context)) {
            const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();
            const name = `${this.opConfig._op}_filtered`;
            const help = `${this.opConfig._op} filtered by date`;
            const labelNames = [...Object.keys(defaultLabels), 'field', 'op_name'];

            await this.context.apis.foundation.promMetrics.addCounter(
                name,
                help,
                labelNames,
                function collect() {
                    this.inc(
                        {
                            field: 'rejected_by_date',
                            op_name: opConfig._op,
                            ...defaultLabels
                        },
                        FilterByDate.rejects
                    );
                }
            );
        }
    }

    filter(record: DataEntity) {
        const now = Date.now();
        const pastGuard = this._getGuardTime(DateDirection.past, now);
        const futureGuard = this._getGuardTime(DateDirection.future, now);

        const valid = this._checkDate(record[this.opConfig.date_field], pastGuard, futureGuard);

        if (!valid) {
            this.rejectRecord(record, new Error('record timestamp does not meet date guard criteria'));

            if (this.opConfig.collect_metrics) {
                FilterByDate.rejects += 1;
            }
        }

        return valid;
    }

    _getGuardTime(guardDirection: DateDirection, now: number) {
        if (guardDirection === DateDirection.past) {
            if (this.is_precise_past_date) {
                // static past comparison
                return this.limit_past;
            }
            // moving past range comparison
            return now - this.limit_past;
        }

        if (this.is_precise_future_date) {
            // moving future range comparison
            return this.limit_future;
        }

        // static future comparison
        return now + this.limit_future;
    }

    _checkDate(date: unknown, pastGuard: number, futureGuard: number): boolean {
        if (this._validTimestamp(date)) {
            const milliDate = getTime(date);

            if (milliDate === false) return false;

            return milliDate >= pastGuard && milliDate <= futureGuard;
        }
        return false;
    }

    _validTimestamp(value: unknown): value is Date {
        return isValidDate(value);
    }
}
