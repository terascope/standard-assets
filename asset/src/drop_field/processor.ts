import {
    MapProcessor,
    OpConfig,
    DataEntity
} from '@terascope/job-components';
import DataWindow from '../__lib/data-window.js';

export default class DropField extends MapProcessor<OpConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        this.dropField(doc);

        return doc;
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => {
            this.dropField(item);
            return item;
        });

        return doc;
    }

    private dropField(doc: DataEntity) {
        if (Array.isArray(this.opConfig.field)) {
            this.opConfig.field.forEach((f) => delete doc[f]);
            return;
        }

        delete doc[this.opConfig.field];
    }
}
