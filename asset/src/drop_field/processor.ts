import {
    MapProcessor,
    OpConfig,
    DataEntity,
} from '@terascope/job-components';
import { FieldValidator } from '@terascope/data-mate';
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
        // drop field everytime, matches value, validation
        if (this.opConfig.drop_method === 'every') {
            delete doc[this.opConfig.field];
            return;
        }

        if (this.opConfig.drop_method === 'regex') {
            const [, regex, flags] = this.opConfig.method_args.split('/');

            const reg = new RegExp(regex, flags);

            if (doc[this.opConfig.field].match(reg)) {
                delete doc[this.opConfig.field];
            }

            return;
        }

        const validationMethod = (FieldValidator as any)[this.opConfig.drop_method];

        if (validationMethod(doc[this.opConfig.field], this.opConfig.method_args)) {
            delete doc[this.opConfig.field];
        }
    }
}
