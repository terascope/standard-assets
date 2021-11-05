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

    it('should throw if given use of 0', () => {
        expect(() => {
            new KeyRouter({
                use: 0,
            });
        }).toThrow('KeyRouter requires that at least one character is selected, use must be greater than 0');
    });
});
