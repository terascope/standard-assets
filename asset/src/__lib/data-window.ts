import { DataEntity } from '@terascope/utils';

/*
    An array of DataEntities inside a DataEntity
*/

// TODO: we cam remove ts-expect-error and this class when DataWindow is native to DataEntity
// @ts-expect-error
export default class DataWindow extends DataEntity {
    static [Symbol.hasInstance](instance: any) {
        if (instance == null) return false;
        return instance.__isDataWindow === true;
    }

    constructor(...args: any[]) {
        // @ts-expect-error
        super(...args);
        this.__isDataWindow = true;
        this.dataArray = [];
    }

    static make(key?: any, docs?: any | any[]) {
        const newWindow = new DataWindow();

        if (key != null) newWindow.setMetadata('_key', key);

        if (docs != null) {
            if (Array.isArray(docs)) {
                newWindow.dataArray = DataEntity.makeArray(docs);
            } else {
                newWindow.set(docs);
            }
        }

        return newWindow;
    }

    set(item: any) {
        this.dataArray.push(DataEntity.make(item));
    }

    get(item: any) {
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
