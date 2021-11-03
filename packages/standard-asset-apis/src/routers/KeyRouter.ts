import { DataEntity } from '@terascope/utils';
import * as I from './interfaces';

/**
 * A key storage routing algorithm
*/
export class KeyRouter implements I.Router {
    readonly kind = I.RouterKind.STORAGE;

    lookup(record: DataEntity): string|number {
        // FIXME
        return record.getKey();
    }
}
