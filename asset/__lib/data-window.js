'use strict';

const _ = require('lodash');
const { DataEntity } = require('@terascope/utils');

/*
    An array of DataEntities inside a DataEntity
*/

class DataWindow extends DataEntity {
    constructor(...args) {
        super(...args);
        this.dataArray = [];
    }

    static make(key, docs) {
        const newWindow = new DataWindow();

        if (key != null) newWindow.setMetadata('_key', key);

        if (docs != null) {
            if (_.isArray(docs)) {
                newWindow.dataArray = docs;
            } else {
                newWindow.set(docs);
            }
        }

        return newWindow;
    }

    set(item) {
        this.dataArray.push(DataEntity.make(item));
    }

    get(item) {
        // returns the index if given a data entity or returns the data entity if given an index
        if (DataEntity.isDataEntity(item)) {
            return this.dataArray.indexOf(item);
        }

        return this.dataArray[item];
    }

    asArray() {
        return this.dataArray;
    }
}

module.exports = DataWindow;