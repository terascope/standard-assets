import {
    DataEntity, getValidDate, TSError
} from '@terascope/utils';
import * as I from './interfaces';

const WEEK_IN_MS = 86400 * 7 * 1000;

export enum DateResolution {
    hourly = 'hourly',
    daily = 'daily',
    monthly = 'monthly',
    yearly = 'yearly',
    weekly_epoch = 'weekly_epoch',
    weekly = 'weekly'
}

export const validDateDelimiters: ReadonlySet<string> = new Set([
    '-',
    '_',
    '.',
    '/',
    ''
]);

/**
 * A routing algorithm that uses a date strings
 * to route the data to different partitions
*/
export class DateRouter implements I.Router {
    readonly kind = I.RouterKind.DATA;
    readonly field: string;
    readonly resolution: DateResolution;
    readonly dateDelimiter: string;
    readonly includeDateUnits: boolean;
    readonly dateUnitDelimiter: string;

    constructor(config: DateRouterConfig) {
        this.field = config.field;
        this.resolution = config.resolution ?? DateResolution.daily;

        this.dateDelimiter = config.date_delimiter ?? '.';
        if (!validDateDelimiters.has(this.dateDelimiter)) {
            throw new Error(`Expected date_delimiter to be one of ${[...validDateDelimiters].join(' ')}, got ${this.dateDelimiter}`);
        }

        this.includeDateUnits = config.include_date_units ?? false;
        this.dateUnitDelimiter = config.date_unit_delimiter ?? '_';
        if (!validDateDelimiters.has(this.dateUnitDelimiter)) {
            throw new Error(`Expected date_unit_delimiter to be one of ${[...validDateDelimiters].join(' ')}, got ${this.dateUnitDelimiter}`);
        }
    }

    lookup(record: DataEntity): string {
        const date = this._getDateValue(record);
        return this._createIndexParts(date).join(this.dateDelimiter);
    }

    private _getDateValue(record: DataEntity): Date {
        const value = record[this.field];

        const date = getValidDate(value);

        if (date === false) {
            throw new TSError(`Could not convert value ${value} to a date`, {
                context: {
                    record
                }
            });
        }

        return date;
    }

    private _createIndexParts(date: Date): string[] {
        const indexParts: string[] = [];
        // Schema enforces these formatting options

        if (this.resolution === DateResolution.weekly_epoch) {
            this._addToIndex(indexParts, 'week', this._getWeeksInEpoch(date));
            return indexParts;
        }

        const [year, month, day, hour] = this._parseDate(date);

        this._addToIndex(indexParts, 'year', year);
        if (this.resolution === DateResolution.yearly) return indexParts;

        if (this.resolution === DateResolution.weekly) {
            this._addToIndex(indexParts, 'week', this._getWeeksInYear(date, year));
            return indexParts;
        }

        this._addToIndex(indexParts, 'month', month);
        if (this.resolution === DateResolution.monthly) return indexParts;

        this._addToIndex(indexParts, 'day', day);
        if (this.resolution === DateResolution.daily) return indexParts;

        this._addToIndex(indexParts, 'hour', hour);
        if (this.resolution === DateResolution.hourly) return indexParts;

        throw new Error(`Unsupported date resolution "${this.resolution}"`);
    }

    private _getWeeksInEpoch(date: Date): number {
        // weeks since Jan 1, 1970
        return Math.floor(date.getTime() / WEEK_IN_MS);
    }

    private _parseDate(date: Date): string[] {
        return date.toISOString().slice(0, 14).split(/[-T\s:]/);
    }

    private _getWeeksInYear(date: Date, year: string): string | number {
        const weeks = Math.floor((date.getTime() - Date.parse(year)) / WEEK_IN_MS);

        if (weeks < 10) return `0${weeks}`;

        return weeks;
    }

    private _addToIndex(partitions: string[], label: string, value: string | number) {
        partitions.push(this._joinValue(label, value));
    }

    private _joinValue(key: string, value: string | number) {
        if (this.includeDateUnits) return `${key}${this.dateUnitDelimiter}${value}`;
        return `${value}`;
    }
}

export interface DateRouterConfig {
    /**
     * This is the primary date field on the record
    */
    field: string;

    /**
     * This is used determine how specific the date
     * routing should be
     *
     * @default {DateResolution.daily}
    */
    resolution?: DateResolution;

    /**
     * The between the date parts, i.e. year, month, date
     *
     * @default '.'
    */
    date_delimiter?: string;

    /**
     * The separator between the date unit and the date value,
     * only used if include_date_units is true.
     *
     * @default '_'
    */
    date_unit_delimiter?: string;

    /**
     * If true the date unit (year, month, day) will be included the route
     *
     * @default false
    */
    include_date_units?: boolean;
}
