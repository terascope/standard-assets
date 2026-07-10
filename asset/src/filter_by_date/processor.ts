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
    static past_rejects_count: number = 0;
    static future_rejects_count: number = 0;
    static bad_date_field_rejects_count: number = 0;

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
            const name = `${this.opConfig._op}_filtered_count`;
            const help = `${this.opConfig._op} filtered count`;
            const labelNames = [...Object.keys(defaultLabels), 'field', 'op_name'];

            await this.context.apis.foundation.promMetrics.addCounter(
                name,
                help,
                labelNames,
                function collect() {
                    this.inc(
                        {
                            field: 'past_rejection',
                            op_name: opConfig._op,
                            ...defaultLabels
                        },
                        FilterByDate.past_rejects_count
                    );

                    this.inc(
                        {
                            field: 'future_rejection',
                            op_name: opConfig._op,
                            ...defaultLabels
                        },
                        FilterByDate.future_rejects_count
                    );

                    this.inc(
                        {
                            field: 'bad_date_field_rejection',
                            op_name: opConfig._op,
                            ...defaultLabels
                        },
                        FilterByDate.bad_date_field_rejects_count
                    );
                }
            );
        }
    }

    filter(record: DataEntity) {
        const now = Date.now();
        const pastGuard = this._getGuardTime(DateDirection.past, now);
        const futureGuard = this._getGuardTime(DateDirection.future, now);

        const dateCheck = this._checkDate(record[this.opConfig.date_field], pastGuard, futureGuard);

        const valid = dateCheck.every((v) => v === false);

        if (!valid) {
            const [badDate, pastReject, futureReject] = dateCheck;

            if (this.opConfig.collect_metrics) {
                if (badDate) FilterByDate.bad_date_field_rejects_count += 1;
                if (pastReject) FilterByDate.past_rejects_count += 1;
                if (futureReject) FilterByDate.future_rejects_count += 1;
            }

            this.rejectRecord(record, new Error('record timestamp does not meet date guard criteria'));
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

    _checkDate(date: unknown, pastGuard: number, futureGuard: number): [boolean, boolean, boolean] {
        let badDate: boolean = false;
        let failurePast: boolean = false;
        let failureFuture: boolean = false;

        if (this._validTimestamp(date)) {
            const milliDate = getTime(date);

            if (milliDate == null || isNaN(milliDate)) {
                badDate = true;
            }

            if (milliDate < pastGuard) {
                failurePast = true;
            }

            if (milliDate > futureGuard) {
                failureFuture = true;
            }
        } else {
            badDate = true;
        }

        return [badDate, failurePast, failureFuture];
    }

    _validTimestamp(value: unknown): value is Date {
        return isValidDate(value);
    }
}
