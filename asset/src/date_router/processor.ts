import {
    MapProcessor, DataEntity, getValidDate, TSError
} from '@terascope/job-components';
import { DateRouterConfig, DateResolution } from './interfaces';

const offsets = {
    [DateResolution.daily]: 10,
    [DateResolution.monthly]: 7,
    [DateResolution.yearly]: 4,
    [DateResolution.weekly]: 10
};

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

        // Schema enforces these formatting options
        if (resolution === 'weekly_epoch') {
            return this._getWeeklyEpochIndex(date);
        }

        const dateComponents = this._parseDate(date);

        const partitions: string[] = [];

        partitions.push(this._joinValue('year', dateComponents[0]));

        if (resolution === DateResolution.yearly) return partitions;

        if (resolution === DateResolution.weekly) {
            partitions.push(this._joinValue('week', this._getWeeksInYear(date, dateComponents[0])));
            return partitions;
        }

        partitions.push(this._joinValue('month', dateComponents[1]));
        if (resolution === DateResolution.monthly) return partitions;

        partitions.push(this._joinValue('day', dateComponents[2]));
        return partitions;
    }

    private _getWeeklyEpochIndex(date: Date): string[] {
        // weeks since Jan 1, 1970
        const epochWeeks = Math.floor(date.getTime() / weekInMs);

        return [this._joinValue('week', epochWeeks)];
    }

    private _parseDate(date: Date): string[] {
        return date.toISOString().slice(0, offsets[this.opConfig.resolution]).split('-');
    }

    private _getWeeksInYear(date: Date, year: string): string | number {
        const weeks = Math.floor((date.getTime() - Date.parse(year)) / weekInMs);

        if (weeks < 10) return `0${weeks}`;

        return weeks;
    }

    private _joinValue(key: string, value: string | number) {
        if (this.opConfig.include_date_units) return `${key}${this.opConfig.value_delimiter}${value}`;
        return `${value}`;
    }
}
