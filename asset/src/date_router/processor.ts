import {
    MapProcessor, DataEntity, getValidDate, TSError
} from '@terascope/job-components';
import { DateRouterConfig, DateResolution } from './interfaces';

const offsets = {
    [DateResolution.daily]: 10,
    [DateResolution.monthly]: 7,
    [DateResolution.yearly]: 4
};

export default class DateRouter extends MapProcessor<DateRouterConfig> {
    private _joinValue(key: string, value: string) {
        return `${key}${this.opConfig.value_delimiter}${value}`;
    }

    private _joinYear(value: string) {
        return this._joinValue('year', value);
    }

    private _joinMonth(value: string) {
        return this._joinValue('month', value);
    }

    private _joinDay(value: string) {
        return this._joinValue('day', value);
    }

    addPath(record: DataEntity) {
        const partitions: string[] = [];

        // This value is enforced by the schema
        const end = offsets[this.opConfig.resolution];
        const value = record[this.opConfig.field];
        const date = getValidDate(record[this.opConfig.field]);

        if (date === false) {
            const error = new TSError(`Could not convert value ${value} to a date`, {
                context: {
                    record
                }
            });
            this.logger.error(error);
            // we do not annotate metadata, it will be dropped
            return;
        }

        const dates = date.toISOString().slice(0, end).split('-');
        // Schema enforces one of these formatting options
        if (this.opConfig.resolution === DateResolution.yearly) {
            partitions.push(this._joinYear(dates[0]));
        } else if (this.opConfig.resolution === DateResolution.monthly) {
            partitions.push(this._joinYear(dates[0]));
            partitions.push(this._joinMonth(dates[1]));
        } else {
            partitions.push(this._joinYear(dates[0]));
            partitions.push(this._joinMonth(dates[1]));
            partitions.push(this._joinDay(dates[2]));
        }

        record.setMetadata(
            'standard:route',
            partitions.join(this.opConfig.field_delimiter)
        );
    }

    map(record: DataEntity) {
        this.addPath(record);
        return record;
    }
}
