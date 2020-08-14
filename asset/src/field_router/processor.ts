import { MapProcessor, DataEntity, toString } from '@terascope/job-components';
import { FieldRouterConfig } from './interfaces';

function sanitize(str: string) {
    return str.replace(/=/gi, '_').replace(/\//gi, '_');
}

export default class FieldRouter extends MapProcessor<FieldRouterConfig> {
    addPath(record: DataEntity): void {
        const partitions: string[] = [];

        this.opConfig.fields.forEach((field) => {
            const fieldData = sanitize(toString(record[field]));
            if (this.opConfig.include_field_names === true) {
                partitions.push(`${field}${this.opConfig.value_delimiter}${fieldData}`);
            } else {
                partitions.push(`${fieldData}`);
            }
        });

        record.setMetadata(
            'standard:route',
            partitions.join(this.opConfig.field_delimiter)
        );
    }

    map(record: DataEntity): DataEntity {
        this.addPath(record);
        return record;
    }
}
