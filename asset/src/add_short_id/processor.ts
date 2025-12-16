import { DataEntity } from '@terascope/core-utils';
import { MapProcessor, Context } from '@terascope/job-components';
import { ExecutionConfig, OpConfig } from '@terascope/types';
import ShortUniqueId from 'short-unique-id';
import DataWindow from '../__lib/data-window.js';
import { UniqueIdOpConfig } from './interfaces.js';

/**
 * Adds a short unique ID of a specified length to the specified field
 * uses https://www.npmjs.com/package/short-unique-id to build the id
 */

export default class AddShortId extends MapProcessor<OpConfig> {
    uniqueId: ShortUniqueId;

    constructor(context: Context, opConfig: UniqueIdOpConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);

        this.uniqueId = new ShortUniqueId({
            length: this.opConfig.length,
            dictionary: this.opConfig.dictionary
        });
    }

    _addId(doc: DataEntity) {
        doc[this.opConfig.field] = this.uniqueId.randomUUID();

        return doc;
    }

    map(doc: DataEntity | DataWindow): DataEntity {
        if (doc instanceof DataWindow) {
            doc.dataArray = doc.asArray().map((item: DataEntity) => this._addId(item));
            return doc;
        }

        return this._addId(doc);
    }
}
