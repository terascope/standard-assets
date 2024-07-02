import {
    MapProcessor,
    OpConfig,
    DataEntity,
} from '@terascope/job-components';
import { set, has } from '@terascope/utils';
import DataWindow from '../__lib/data-window.js';

export default class SetField extends MapProcessor<OpConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        this.setField(doc);

        return doc;
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => {
            this.setField(item);
            return item;
        });

        return doc;
    }

    private setField(doc: DataEntity) {
        if (has(doc, this.opConfig.field) && this.opConfig.overwrite === false) {
            return;
        }

        set(doc, this.opConfig.field, this.opConfig.value);
    }
}
