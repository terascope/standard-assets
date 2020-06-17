import { MapProcessor, DataEntity, OpConfig } from '@terascope/job-components';
import DataWindow from '../__lib/data-window';

export default class SetKey extends MapProcessor<OpConfig> {
    // Does this need to make a new DataEntity since it recieves one starting out?
    _setKey(doc: DataEntity): DataEntity {
        if (DataEntity.isDataEntity(doc)) {
            doc.setMetadata('_key', undefined);
            return doc;
        }
        return DataEntity.make(doc, { _key: undefined });
    }

    map(doc: DataEntity | DataWindow): DataEntity {
        if (doc instanceof DataWindow) {
            doc.dataArray = doc.asArray().map((item: DataEntity) => this._setKey(item));
            return doc;
        }

        return this._setKey(doc);
    }
}
