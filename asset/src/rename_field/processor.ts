import { DataEntity } from '@terascope/core-utils';
import { MapProcessor } from '@terascope/job-components';
import { RenameFieldConfig } from './interfaces.js';
import DataWindow from '../__lib/data-window.js';

export default class RenameField extends MapProcessor<RenameFieldConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        this.renameField(doc);

        return doc;
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => {
            this.renameField(item);
            return item;
        });

        return doc;
    }

    private renameField(doc: DataEntity) {
        Object.entries(this.opConfig.mapping).forEach(([from, to]) => {
            // Only move fields that are present on the record; a rename to the
            // same name is a no-op. The value is moved as-is (including falsy
            // values like 0 or "") and the original field is removed.
            if (from === to) return;
            if (!Object.prototype.hasOwnProperty.call(doc, from)) return;

            doc[to] = doc[from];
            delete doc[from];
        });
    }
}
