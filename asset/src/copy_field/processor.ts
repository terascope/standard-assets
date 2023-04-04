import {
    MapProcessor,
    OpConfig,
    DataEntity,
} from '@terascope/job-components';
import { get, set } from '@terascope/utils';
import DataWindow from '../__lib/data-window';

export default class CopyField extends MapProcessor<OpConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        this.copyField(doc);

        return doc;
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => {
            this.copyField(item);
            return item;
        });

        return doc;
    }

    private copyField(doc: DataEntity) {
        const sourceValue = get(doc, this.opConfig.source);

        if (sourceValue != null) {
            set(doc, this.opConfig.destination, sourceValue);
        }

        if (this.opConfig.delete_source) {
            delete doc[this.opConfig.source];
        }
    }
}
