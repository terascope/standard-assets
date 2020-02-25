import { MapProcessor, DataEntity, toString } from '@terascope/job-components';
import { FieldRouterConfig } from './interfaces';

function santize(str: string) {
    return str.replace(/=/gi, '_').replace(/\//gi, '_');
}

export default class FieldRouter extends MapProcessor<FieldRouterConfig> {
    addPath(record: DataEntity) {
        const partitions: string[] = [];

        this.opConfig.fields.forEach((field) => {
            const fieldData = santize(toString(record[field]));
            partitions.push(`${field}${this.opConfig.value_delimiter}${fieldData}`);
        });

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
