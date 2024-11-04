import {
    FilterProcessor, isISO8601, ExecutionConfig,
    Context, DataEntity, isValidDate, isInteger,
    getTime
} from '@terascope/job-components';
import { DateGuardConfig } from './interfaces.js';

/*
    Guards against records that have bad dates, either too far in the past or the future.
    Returns an array minus the objects that violate the date rules.
    Acceptable units are minutes, hours, day, week, month, year.
    Records with dates that are not ISO 8601, linux time
    (seconds or milliseconds), or date objects will be dropped.
*/

enum DateDirection {
    past = 'past',
    future = 'future'
}

const min = 60;
const hour = 60 * min;
const day = 24 * hour;
const week = 7 * day;
const month = 30 * day;
const year = 365 * day;

const seconds = {
    m: min,
    minute: min,
    minutes: min,
    h: hour,
    hour,
    hours: hour,
    d: day,
    day,
    days: day,
    w: week,
    week,
    weeks: week,
    M: month,
    month,
    months: month,
    Y: year,
    year,
    years: year
};

type SecondsKey = keyof typeof seconds;

export default class DateGuard extends FilterProcessor<DateGuardConfig> {
    private limit_past?: number;
    private limit_future?: number;

    constructor(context: Context, opConfig: DateGuardConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);

        if (isISO8601(this.opConfig.limit_past)) {
            this.limit_past = new Date(this.opConfig.limit_past).getTime();
        }

        if (isISO8601(this.opConfig.limit_future)) {
            this.limit_future = new Date(this.opConfig.limit_future).getTime();
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
            if (this.limit_past) {
                return this.limit_past;
            }

            const [timeLength, timeUnits] = this._parseLimit(this.opConfig.limit_past);
            return now - (timeLength * this._limitToMilliseconds(timeUnits));
        }

        if (this.limit_future) {
            return this.limit_future;
        }

        const [timeLength, timeUnits] = this._parseLimit(this.opConfig.limit_future);
        return now + (timeLength * this._limitToMilliseconds(timeUnits));
    }

    _parseLimit(limit: string): [number, SecondsKey] {
        // gets the number and time unit
        const numPattern = /^[\d]+(\.[\d]+)?/;
        const matchCall = limit.match(numPattern) as RegExpMatchArray;
        const number = matchCall[0];

        return [Number(number), limit.slice(number.length) as SecondsKey];
    }

    _checkDate(date: unknown, pastGuard: number, futureGuard: number): boolean {
        if (this._validTimestamp(date)) {
            const milliDate = this._timeStampToMilliseconds(date);
            if (milliDate === false) return false;

            return milliDate >= pastGuard && milliDate <= futureGuard;
        }
        return false;
    }

    _validTimestamp(value: unknown): value is Date {
        return isValidDate(value);
    }

    _toWholeNumber(value: Date | string | number) {
        if (isInteger(Number(value))) {
            return value;
        }

        return `${value}`.split('.')[0];
    }

    _timeStampToMilliseconds(date: Date | string | number) {
        if (typeof date === 'number' && String(this._toWholeNumber(date)).length < 11) {
            return getTime(date * 1000);
        }
        return getTime(date);
    }

    _limitToMilliseconds(limit: SecondsKey) {
        return seconds[limit] * 1000;
    }
}
