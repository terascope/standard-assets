import { DataEntity } from '@terascope/core-utils';
import {
    MapProcessor,
    OpConfig,
} from '@terascope/job-components';
import DataWindow from '../__lib/data-window.js';

export default class KeepField extends MapProcessor<OpConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        this.keepField(doc);

        return doc;
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => {
            this.keepField(item);
            return item;
        });

        return doc;
    }

    private keepField(doc: DataEntity) {
        const keep = Array.isArray(this.opConfig.field)
            ? this.opConfig.field
            : [this.opConfig.field];

        Object.keys(doc).forEach((field) => {
            if (!keep.includes(field)) delete doc[field];
        });
    }
}
