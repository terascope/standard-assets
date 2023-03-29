import {
    MapProcessor,
    OpConfig,
    DataEntity,
} from '@terascope/job-components';
import DataWindow from '../__lib/data-window';

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
        delete doc[this.opConfig.field];
    }
}
