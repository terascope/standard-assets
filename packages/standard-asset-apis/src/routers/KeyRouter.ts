import { DataEntity } from '@terascope/utils';
import * as I from './interfaces';

/**
 * A key storage routing algorithm
*/
export class KeyRouter implements I.Router {
    readonly kind = I.RouterKind.STORAGE;
    readonly transformKey: (key: string) => string;

    constructor(config: KeyRouterConfig) {
        const extractionFn = extraction(config);
        const caseFn = caseTransforms(config.case);

        this.transformKey = (key) => caseFn(extractionFn(key));
    }

    lookup(record: DataEntity): string|number {
        return this.transformKey(String(record.getKey()));
    }
}

export enum KeyRouterCaseOptions {
    preserve = 'preserve',
    lower = 'lower',
    upper = 'upper'
}

export enum KeyRouterFromOptions {
    beginning = 'beginning',
    end = 'end',
}

export interface KeyRouterConfig {
    /**
     * The number of characters to use from the key.
     * Use {@see KeyRouterFromOptions.end} to make this select
     * n chars from the end of the string
    */
    use?: number;

    /**
     * @default {KeyRouterFromOptions.beginning}
    */
    from?: KeyRouterFromOptions;

    /**
     * @default {KeyRouterCaseOptions.preserve}
    */
    case?: KeyRouterCaseOptions;
}

function extraction(config: KeyRouterConfig): (key: string) => string {
    if (config.use != null) {
        if (config.use === 0) {
            throw new RangeError('KeyRouter requires that at least one character is selected, use must be greater than 0');
        }

        if (config.from === KeyRouterFromOptions.end) {
            const start = -Math.abs(config.use);
            return (key) => key.slice(start);
        }

        const end = config.use;
        return (key) => key.slice(0, end);
    }

    return (key) => key;
}

function caseTransforms(caseOption = KeyRouterCaseOptions.preserve): (key: string) => string {
    if (caseOption === KeyRouterCaseOptions.lower) {
        return (key) => key.toLowerCase();
    }

    if (caseOption === KeyRouterCaseOptions.upper) {
        return (key) => key.toUpperCase();
    }

    return (key) => key;
}
