import { DataEntity } from '@terascope/core-utils';
import 'jest-extended';
import {
    KeyRouter, KeyRouterCaseOptions, KeyRouterFromOptions
} from '../../src/index.js';

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
            case: KeyRouterCaseOptions.lower,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('Rm9vQmFy');
        expect(entity.getKey()).toEqual('Rm9vQmFy');
        expect(router.lookup(entity)).toEqual('r--u');
    });

    it('should work with use 1 from the beginning and setting suffix for uppercase character and case upper', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.upper,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('Rm9vQmFy');
        expect(entity.getKey()).toEqual('Rm9vQmFy');
        expect(router.lookup(entity)).toEqual('R--U');
    });

    it('should work with use 1 from the beginning and not setting suffix for lowercase', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.lower,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u',
            suffix_lower: ''
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('bm90Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('b');
    });

    it('should not append suffix with use 3 from the beginning and not setting suffix for lowercase', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.preserve,
            use: 3,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u',
            suffix_lower: '--l'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('bM90Rm9vQmFy');

        expect(router.lookup(entity)).toEqual('bM9');
    });

    it('should work with use 1 from the beginning and setting suffix for lowercase', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.lower,
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

    it('should work with use 1 from the beginning and setting suffix false for number', () => {
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

    it('should work with use 1 from the end and setting suffix true', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.lower,
            use: 1,
            from: KeyRouterFromOptions.end,
            suffix_use: true,
            suffix_upper: '--u'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('0m90Rm9vQmFY');

        expect(router.lookup(entity)).toEqual('y--u');
    });

    it('should work with use 1 from the beginning and setting suffix for all characters', () => {
        const router = new KeyRouter({
            case: KeyRouterCaseOptions.lower,
            use: 1,
            from: KeyRouterFromOptions.beginning,
            suffix_use: true,
            suffix_upper: '--u',
            suffix_lower: '--l',
            suffix_number: '--n',
            suffix_other: '--c'
        });

        const entity = new DataEntity({ foo: 'bar' });
        entity.setKey('Rm9vQmFy');
        expect(entity.getKey()).toEqual('Rm9vQmFy');
        expect(router.lookup(entity)).toEqual('r--u');
        entity.setKey('rm9vQmFy');
        expect(entity.getKey()).toEqual('rm9vQmFy');
        expect(router.lookup(entity)).toEqual('r--l');
        entity.setKey('0m9vQmFy');
        expect(entity.getKey()).toEqual('0m9vQmFy');
        expect(router.lookup(entity)).toEqual('0--n');
        entity.setKey('_m9vQmFy');
        expect(entity.getKey()).toEqual('_m9vQmFy');
        expect(router.lookup(entity)).toEqual('_--c');
    });

    it('should throw if given use of 0', () => {
        expect(() => {
            new KeyRouter({
                use: 0,
            });
        }).toThrow('KeyRouter requires that at least one character is selected, use must be greater than 0');
    });

    it('should throw if given suffix_use true and not defined suffix', () => {
        expect(() => {
            new KeyRouter({
                case: KeyRouterCaseOptions.lower,
                use: 1,
                from: KeyRouterFromOptions.beginning,
                suffix_use: true,
            });
        }).toThrow('KeyRouter requires that at least one suffix_(upper/lower/other/number) value be specified');
    });
});
