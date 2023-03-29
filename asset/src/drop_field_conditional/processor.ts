import {
    MapProcessor,
    OpConfig,
    DataEntity
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
        if (this.opConfig.regex != null) {
            const matchesRegex = this.runRegex(doc);

            if (this.shouldDrop(matchesRegex)) {
                delete doc[this.opConfig.field];
            }

            return;
        }

        if (this.opConfig.validation_method) {
            const valid = this.runValidation(doc);

            if (this.shouldDrop(valid)) {
                delete doc[this.opConfig.field];
            }
        }
    }

    private runRegex(doc: DataEntity): boolean {
        const lastFwdSlash = this.opConfig.regex.lastIndexOf('/');

        const regex = this.opConfig.regex.slice(1, lastFwdSlash);
        const flags = this.opConfig.regex.slice(lastFwdSlash + 1);

        const reg = new RegExp(regex, flags);

        return Boolean(doc[this.opConfig.field].match(reg));
    }

    private runValidation(doc: DataEntity): boolean {
        const value = doc[this.opConfig.field];

        const validationFunc = (FieldValidator as any)[this.opConfig.validation_method];

        if (this.opConfig.validation_args) {
            return validationFunc(value, {}, this.opConfig.validation_args);
        }

        return Boolean(validationFunc(value));
    }

    private shouldDrop(value: boolean): boolean {
        if (this.opConfig.invert) return !value;

        return value;
    }
}
