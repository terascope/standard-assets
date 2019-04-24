'use strict';

const { DataEntity } = require('@terascope/utils');

class DataWindow extends DataEntity {
    constructor(key, ...args) {
        super(...args);

        this.dataArray = [];
        this.key = key;
    }

    set(item) {
        this.dataArray.push(item);
    }

    get(item) {
        return this.dataArray[item];
    }

    asArray() {
        return this.dataArray;
    }
}

module.exports = DataWindow;