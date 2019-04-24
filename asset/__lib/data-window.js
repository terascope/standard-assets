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

        if (key !== undefined) newWindow.setMetadata('_key', key);

        if (docs !== undefined) {
            if (_.isArray(docs)) {
                newWindow.dataArray = DataEntity.makeArray(docs);
            } else {
                newWindow.set(docs);
            }
        }

        return newWindow;
    }

    set(item) {
        if (DataEntity.isDataEntity(item)) {
            this.dataArray.push(item);
        }
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
