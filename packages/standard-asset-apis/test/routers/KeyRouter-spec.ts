import { DataEntity } from '@terascope/utils';
import 'jest-extended';
import {
    KeyRouter, KeyRouterCaseOptions, KeyRouterFromOptions
} from '../../src';

describe('KeyRouter', () => {
    it('should work with upper case', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.upper
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('foobar');

        expect(router.lookup(entity)).toEqual('FOOBAR');
    });

    it('should work with lower case', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.lower
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('FooBar');

        expect(router.lookup(entity)).toEqual('foobar');
    });

    it('should work with preserve casing', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('FooBar');

        expect(router.lookup(entity)).toEqual('FooBar');
    });

    it('should work with use 1 from the beginning', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.beginning
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('FooBar');

        expect(router.lookup(entity)).toEqual('F');
    });

    it('should work with use 1 from the end', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.end
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('FooBar');

        expect(router.lookup(entity)).toEqual('r');
    });

    it('should work with use 3 from the end with lower case', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.lower,
            use: 3,
            from: KeyRouterFromOptions.end
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('FooBar');

        expect(router.lookup(entity)).toEqual('bar');
    });

    it('should work with use 3 from the beginning with upper case', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.upper,
            use: 3,
            from: KeyRouterFromOptions.beginning
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('FooBar');

        expect(router.lookup(entity)).toEqual('FOO');
    });

    it('should work with use 1 from the beginning and setting suffix for uppercase character', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('r--u');
    });

    it('should work with use 1 from the beginning and not setting suffix for lowercase', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('bm90Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('b');
    });

    it('should work with use 1 from the beginning and setting suffix for lowercase', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u',
            suffix_lower: '--l'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('bm90Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('b--l');
    });

    it('should work with use 1 from the beginning and setting suffix for other', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_other: '--c'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('_m90Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('_--c');
    });

    it('should work with use 1 from the beginning and setting suffix for number', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_number: '--n'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('0m90Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('0--n');
    });

    it('should work with use 1 from the beginning and setting suffix for number', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: false,
            suffix_number: '--n'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('0m90Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('0');
    });


    it('should throw if given use of 0', () => {
        expect(() => {
            new KeyRouter({
                use: 0,
            });
        }).toThrow('KeyRouter requires that at least one character is selected, use must be greater than 0');
    });

    it('should throw if given use greater than 1, not preserve case, and use suffix', () => {
        expect(() => {
            new KeyRouter({
                use: 3,
                suffix_use: true,
                suffix_upper: '--u',
                case: KeyRouterCaseOptions.lower
            });
        }).toThrow('KeyRouter may clobber keys when changing case with more than one routing key');
    });
    it('should throw if given use greater than 1, not preserve case, and use suffix', () => {
        expect(() => {
            new KeyRouter({
                use: 3,
                suffix_use: true,
                suffix_upper: '--u',
                case: KeyRouterCaseOptions.upper
            });
        }).toThrow('KeyRouter may clobber keys when changing case with more than one routing key');
    });
    it('should throw if given use greater than 1, not preserve case, and use suffix', () => {
        expect(() => {
            new KeyRouter({
                use: 3,
                suffix_use: true,
                suffix_upper: '--u',
                case: KeyRouterCaseOptions.preserve
            });
        }).toThrow('KeyRouter with suffix_use:true only works with use:1');
    });

});
