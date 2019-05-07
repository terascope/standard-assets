'use strict';

const { MapProcessor, DataEntity } = require('@terascope/job-components');
const DataWindow = require('../__lib/data-window');

class SetKey extends MapProcessor {
    _setKey(doc) {
        if (DataEntity.isDataEntity(doc)) {
            doc.setMetadata('_key', doc[this.opConfig.field]);
            return doc;
        }
        return DataEntity.make(doc, { _key: doc[this.opConfig.field] });
    }


    map(doc) {
        if (doc instanceof DataWindow) {
            doc.dataArray = doc.asArray().map(item => this._setKey(item));
            return doc;
        }

        return this._setKey(doc);
    }
}

module.exports = SetKey;
