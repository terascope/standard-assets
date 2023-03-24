import {
    MapProcessor,
    OpConfig,
    DataEntity,
} from '@terascope/job-components';
import { get, set } from '@terascope/utils';
import DataWindow from '../__lib/data-window';

export default class CopyProperty extends MapProcessor<OpConfig> {
    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            doc.dataArray = doc.asArray()
                .map((item: DataEntity) => {
                    this.copyProperty(item);
                    return item;
                });

            return doc;
        }

        this.copyProperty(doc);

        return doc;
    }

    private copyProperty(doc: DataEntity) {
        const sourceValue = get(doc, this.opConfig.source);

        if (sourceValue != null) {
            set(doc, this.opConfig.destination, sourceValue);
        }
    }
}
