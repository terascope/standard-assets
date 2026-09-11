import { MapProcessor } from '@terascope/job-components';
import { DataEntity, formatDateValue, has, set } from '@terascope/core-utils';
import { AddDateConfig } from './interfaces.js';
import DataWindow from '../__lib/data-window.js';

export default class AddDate extends MapProcessor<AddDateConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        this.addDate(doc);

        return doc;
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => {
            this.addDate(item);
            return item;
        });

        return doc;
    }

    private addDate(doc: DataEntity) {
        if (has(doc, this.opConfig.field) && this.opConfig.overwrite === false) {
            return;
        }

        set(doc, this.opConfig.field, formatDateValue(new Date(), this.opConfig.format));
    }
}
