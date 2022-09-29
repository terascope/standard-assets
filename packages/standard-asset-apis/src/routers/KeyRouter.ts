import { DataEntity } from '@terascope/utils';
import * as I from './interfaces';

/**
 * A routing algorithm that uses the record key
 * with some optional transformations
*/
export class KeyRouter implements I.Router {
    readonly kind = I.RouterKind.STORAGE;
    readonly transformKey: (key: string) => string;

    constructor(config: KeyRouterConfig) {
        const extractionFn = extraction(config);
        const caseFn = caseTransforms(config.case);

        this.transformKey = (key) => caseFn(extractionFn(key));
    }

    lookup(record: DataEntity): string {
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

    /**
     * @default false
     */
    suffix_use?: boolean;

    /**
     * @default ''
     */
    suffix_upper?: string;

    /**
     * @default ''
     */
    suffix_lower?: string;

    /**
     * @default ''
     */
    suffix_other?: string;

    /**
     * @default ''
     */
    suffix_number?: string;

}

function extraction(config: KeyRouterConfig): (key: string) => string {
    // set suffix defaults
    const suffixUpper = config.suffix_upper ?? '';
    const suffixLower = config.suffix_lower ?? '';
    const suffixOther = config.suffix_other ?? '';
    const suffixNumber = config.suffix_number ?? '';
    const suffixUse = config.suffix_use ?? false;

    if (config.use != null) {
        if (config.use === 0) {
            throw new RangeError('KeyRouter requires that at least one character is selected, use must be greater than 0');
        }
        if (config.use > 1 && config.case !== 'preserve' && suffixUse) {
            throw new RangeError('KeyRouter may clobber keys when changing case with more than one routing key');
        }
        if (config.use > 1 && config.case === 'preserve' && suffixUse) {
            throw new RangeError('KeyRouter with suffix_use:true only works with use:1');
        }

        if (config.from === KeyRouterFromOptions.end) {
            const start = -Math.abs(config.use);
            return (key) => key.slice(start);
        }

        const end = config.use;
        /* Append a suffix to the routing key as defined suffix_upper, suffix_lower,
         * suffix_number, and suffix_other when suffix_use is true
        */
        if (end === 1 && suffixUse) {
            return (key) => {
                const val = key.slice(0, end);
                let routingKey: string;
                if (/[A-Z]/.test(val)) {
                    routingKey = suffixUse ? `${val.toLowerCase()}${suffixUpper}` : val;
                } else if (/[a-z]/.test(val)) {
                    routingKey = suffixUse ? `${val}${suffixLower}` : val;
                } else if (/[0-9]/.test(val)) {
                    routingKey = suffixUse ? `${val}${suffixNumber}` : val;
                } else {
                    routingKey = suffixUse ? `${val}${suffixOther}` : val;
                }
                return routingKey;
            };
        }

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
