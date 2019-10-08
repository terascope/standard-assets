"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@terascope/utils");
/*
    An array of DataEntities inside a DataEntity
*/
// TODO: remove ts-ignore
// @ts-ignore
class DataWindow extends utils_1.DataEntity {
    static [Symbol.hasInstance](instance) {
        if (instance == null)
            return false;
        return instance.__isDataWindow === true;
    }
    constructor(...args) {
        // @ts-ignore FIXME:
        super(...args);
        this.__isDataWindow = true;
        this.dataArray = [];
    }
    static make(key, docs) {
        const newWindow = new DataWindow();
        if (key != null)
            newWindow.setMetadata('_key', key);
        if (docs != null) {
            if (Array.isArray(docs)) {
                newWindow.dataArray = utils_1.DataEntity.makeArray(docs);
            }
            else {
                newWindow.set(docs);
            }
        }
        return newWindow;
    }
    set(item) {
        this.dataArray.push(utils_1.DataEntity.make(item));
    }
    get(item) {
        // returns the index if given a data entity or returns the data entity if given an index
        if (utils_1.DataEntity.isDataEntity(item)) {
            return this.dataArray.indexOf(item);
        }
        return this.dataArray[item];
    }
    asArray() {
        return this.dataArray;
    }
}
exports.default = DataWindow;
//# sourceMappingURL=data-window.js.map