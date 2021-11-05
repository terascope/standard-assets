import { DataEntity } from '@terascope/utils';

export enum RouterKind {
    DATA = 'DATA',
    STORAGE = 'STORAGE',
}

export interface Router {
    readonly kind: RouterKind;

    /**
     * When called this uses the routing algorithm to return the
     * route to use, which usually is a string|number with meaning to the
     * application (like where to write the record to)
    */
    lookup(record: DataEntity<Record<string, unknown>>): string;
}
