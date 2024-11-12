import {
    DataEntity, getTypeOf, isInteger,
    toString
} from '@terascope/utils';
import fnv1a from '@sindresorhus/fnv1a';
import * as I from './interfaces.js';

/**
 * A routing algorithm that uses a non-cryptographic hash
 * of the values using fnv1a which then will place
 * the hashes to fixed set of partitions
*/
export class HashRouter implements I.Router {
    readonly kind = I.RouterKind.STORAGE;
    readonly partitions: number;
    readonly fields: (readonly string[])|(string[]);
    readonly getHash: (record: DataEntity) => string;

    constructor(config: HashRouterConfig) {
        if (!isInteger(config.partitions) || config.partitions <= 0) {
            throw new RangeError(`Expected partitions to be integer > 0, got "${config.partitions}" (${getTypeOf(config.partitions)})`);
        }
        this.partitions = config.partitions;
        this.fields = config.fields?.slice() ?? [];

        this.getHash = (record) => {
            if (!this.fields.length) {
                return String(record.getKey());
            }

            return this.fields.map((field) => toString(record[field])).join('');
        };
    }

    lookup(record: DataEntity): string {
        const bucket = Number(fnv1a(this.getHash(record), { size: 32 })) % this.partitions;
        return bucket.toString();
    }
}

export interface HashRouterConfig {
    /**
     * The number of partitions to be created based of the hash
    */
    partitions: number;

    /**
     * Fields to use for the key, this must
     * include at least one field. If this is not set,
     * the _key will be used
    */
    fields?: (readonly string[])|(string[]);
}
