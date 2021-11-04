import {
    DataEntity, getTypeOf, isInteger, toString
} from '@terascope/utils';
import fnv1a from '@sindresorhus/fnv1a';
import * as I from './interfaces';

/**
 * A routing algorithm that uses a non-crypto hash
 * of the
*/
export class HashRouter implements I.Router {
    readonly kind = I.RouterKind.STORAGE;
    readonly buckets: number;
    readonly fields: (readonly string[])|(string[]);
    readonly getHash: (record: DataEntity) => string;

    constructor(config: HashRouterConfig) {
        if (!isInteger(config.buckets) || config.buckets <= 0) {
            throw new RangeError(`Expected buckets to be integer > 0, got "${config.buckets}" (${getTypeOf(config.buckets)})`);
        }
        this.buckets = config.buckets;
        this.fields = config.fields?.slice() ?? [];

        this.getHash = (record) => {
            if (!this.fields.length) {
                return String(record.getKey());
            }
            return this.fields.map((field) => toString(record[field])).join('');
        };
    }

    lookup(record: DataEntity): string {
        const bucket = fnv1a(this.getHash(record)) % this.buckets;
        return bucket.toString();
    }
}

export interface HashRouterConfig {
    /**
     * The number of buckets to created based of the hash
    */
    buckets: number;

    /**
     * This fields to use for the key, this must
     * include at least one field. If this is not set,
     * the _key will be used
    */
    fields?: (readonly string[])|(string[]);
}
