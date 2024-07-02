import { MapProcessor, DataEntity } from '@terascope/job-components';
import DataWindow from '../__lib/data-window.js';
import { SetKeyConfig } from './interfaces.js';

export default class SetKey extends MapProcessor<SetKeyConfig> {
    private _setKey(doc: DataEntity) {
        if (DataEntity.isDataEntity(doc)) {
            doc.setMetadata('_key', doc[this.opConfig.field]);
            return doc;
        }
        return DataEntity.make(doc, { _key: doc[this.opConfig.field] });
    }

    map(doc: DataEntity | DataWindow): DataEntity {
        if (doc instanceof DataWindow) {
            doc.dataArray = doc.asArray().map((item: DataEntity) => this._setKey(item));
            return doc;
        }

        return this._setKey(doc);
    }
}
