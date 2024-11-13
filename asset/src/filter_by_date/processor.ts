import {
    FilterProcessor, Context, ExecutionConfig,
    DataEntity, isValidDate, getTime, isISO8601
} from '@terascope/job-components';
import ms from 'ms';
import { FilterByDateConfig } from './interfaces.js';

enum DateDirection {
    past = 'past',
    future = 'future'
}

export default class FilterByDate extends FilterProcessor<FilterByDateConfig> {
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

    filter(record: DataEntity) {
        const now = Date.now();
        const pastGuard = this._getGuardTime(DateDirection.past, now);
        const futureGuard = this._getGuardTime(DateDirection.future, now);

        return this._checkDate(record[this.opConfig.date_field], pastGuard, futureGuard);
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
