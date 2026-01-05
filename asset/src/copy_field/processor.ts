import { MapProcessor } from '@terascope/job-components';
import { DataEntity, get, set } from '@terascope/core-utils';
import { CopyFieldConfig } from './interfaces.js';
import DataWindow from '../__lib/data-window.js';

export default class CopyField extends MapProcessor<CopyFieldConfig> {
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
