import {
    MapProcessor, DataEntity, getValidDate, TSError
} from '@terascope/job-components';
import { DateRouterConfig, DateResolution } from './interfaces';

const weekInMs = 86400 * 7 * 1000;

export default class DateRouter extends MapProcessor<DateRouterConfig> {
    map(record: DataEntity): DataEntity {
        this.addPath(record);
        return record;
    }

    addPath(record: DataEntity): void {
        const date = this._getDateValue(record);

        if (date == null) return;

        const indexParts = this._createIndexParts(date);

        record.setMetadata(
            'standard:route',
            indexParts.join(this.opConfig.field_delimiter)
        );
    }

    private _getDateValue(record: DataEntity): Date | undefined {
        const value = record[this.opConfig.field];

        const date = getValidDate(value);

        if (date === false) {
            const error = new TSError(`Could not convert value ${value} to a date`, {
                context: {
                    record
                }
            });
            this.logger.error(error);
            // can't annotate metadata, record will be dropped
            return;
        }

        return date;
    }

    private _createIndexParts(date: Date): string[] {
        const { resolution } = this.opConfig;

        const indexParts: string[] = [];
        // Schema enforces these formatting options

        if (resolution === 'weekly_epoch') {
            this._addToIndex(indexParts, 'week', this._getWeeksInEpoch(date));
            return indexParts;
        }

        const [year, month, day] = this._parseDate(date);

        this._addToIndex(indexParts, 'year', year);
        if (resolution === DateResolution.yearly) return indexParts;

        if (resolution === DateResolution.weekly) {
            this._addToIndex(indexParts, 'week', this._getWeeksInYear(date, year));
            return indexParts;
        }

        this._addToIndex(indexParts, 'month', month);
        if (resolution === DateResolution.monthly) return indexParts;

        this._addToIndex(indexParts, 'day', day);
        return indexParts;
    }

    private _getWeeksInEpoch(date: Date): number {
        // weeks since Jan 1, 1970
        return Math.floor(date.getTime() / weekInMs);
    }

    private _parseDate(date: Date): string[] {
        return date.toISOString().slice(0, 10).split('-');
    }

    private _getWeeksInYear(date: Date, year: string): string | number {
        const weeks = Math.floor((date.getTime() - Date.parse(year)) / weekInMs);

        if (weeks < 10) return `0${weeks}`;

        return weeks;
    }

    private _addToIndex(partitions: string[], label: string, value: string | number) {
        partitions.push(this._joinValue(label, value));
    }

    private _joinValue(key: string, value: string | number) {
        if (this.opConfig.include_date_units) return `${key}${this.opConfig.value_delimiter}${value}`;
        return `${value}`;
    }
}
