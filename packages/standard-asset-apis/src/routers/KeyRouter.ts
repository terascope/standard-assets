import { DataEntity, debugLogger } from '@terascope/utils';
import * as I from './interfaces';

const logger = debugLogger('key_router');

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

/**
 * A routing algorithm that uses the record key
 * with some optional transformations
*/
export class KeyRouter implements I.Router {
    readonly kind = I.RouterKind.STORAGE;
    readonly transformKey: (key: string) => string;
    readonly config: KeyRouterConfig;
    suffixSize: number;
    constructor(config: KeyRouterConfig) {
        this.config = config;
        // set defaults for suffix
        this.config.suffix_upper = config.suffix_upper ?? '';
        this.config.suffix_lower = config.suffix_lower ?? '';
        this.config.suffix_other = config.suffix_other ?? '';
        this.config.suffix_number = config.suffix_number ?? '';
        this.config.suffix_use = config.suffix_use ?? false;
        this.suffixSize = 0;
        if (this.config.use != null) {
            if (this.config.use > 1 && this.config.suffix_use) {
                logger.warn('KeyRouter may clobber keys when changing case with more than one routing key');
            }
            if (this.config.suffix_use
                && this.config.suffix_upper === ''
                && this.config.suffix_lower === ''
                && this.config.suffix_other === ''
                && this.config.suffix_number === '') {
                throw new Error('KeyRouter requires that at least one suffix_(upper/lower/other/number) value be specified');
            }
        }

        const extractionFn = this.extraction();
        const caseFn = this.caseTransforms(this.config.case);

        // With this order the case function converts the suffix to uppercase when using case upper
        this.transformKey = (key) => caseFn(this.addSuffix((extractionFn(key))));
    }

    lookup(record: DataEntity): string {
        return this.transformKey(String(record.getKey()));
    }

    private extraction(): (key: string) => string {
        if (this.config.use != null) {
            if (this.config.use === 0) {
                throw new RangeError('KeyRouter requires that at least one character is selected, use must be greater than 0');
            }

            if (this.config.from === KeyRouterFromOptions.end) {
                const start = -Math.abs(this.config.use);
                return (key) => key.slice(start);
            }

            const end = this.config.use;

            return (key) => key.slice(0, end);
        }

        return (key) => key;
    }

    private caseTransforms(caseOption = KeyRouterCaseOptions.preserve): (key: string) => string {
        if (caseOption === KeyRouterCaseOptions.lower) {
            return (key) => key.toLowerCase();
        }

        if (caseOption === KeyRouterCaseOptions.upper) {
            return (key) => key.toUpperCase();
        }

        return (key) => key;
    }

    private addSuffix(key: string): string {
        /* Append a suffix to the routing key as defined suffix_upper, suffix_lower,
         * suffix_number, and suffix_other when suffix_use is true
         */

        if (this.config.use === 1 && this.config.suffix_use) {
            let routingKey: string;
            if (/[A-Z]/.test(key)) {
                routingKey = `${key}${this.config.suffix_upper}`;
            } else if (/[a-z]/.test(key)) {
                routingKey = `${key}${this.config.suffix_lower}`;
            } else if (/[0-9]/.test(key)) {
                routingKey = `${key}${this.config.suffix_number}`;
            } else {
                routingKey = `${key}${this.config.suffix_other}`;
            }
            return routingKey;
        }
        return key;
    }
}
