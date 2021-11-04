import { DataEntity } from '@terascope/utils';
import 'jest-extended';
import {
    FieldRouter
} from '../../src';

describe('FieldRouter', () => {
    it('should work with one field', () => {
        const router = new FieldRouter({
            fields: ['foo']
        });

        const entity = new DataEntity({ foo: 'bar' });
        expect(router.lookup(entity)).toEqual('foo_bar');
    });

    it('should work with one field with un-sanitized values', () => {
        const router = new FieldRouter({
            fields: ['foo'],
        });

        const entity = new DataEntity({ foo: 'bar=asd/123/=' });
        expect(router.lookup(entity)).toEqual('foo_bar_asd_123__');
    });

    it('should work with two fields without fields names', () => {
        const router = new FieldRouter({
            fields: ['foo1', 'foo2'],
            include_field_names: false
        });

        const entity = new DataEntity({ foo1: 'bar1', foo2: 'bar2' });
        expect(router.lookup(entity)).toEqual('bar1-bar2');
    });

    it('should work with two fields with custom delimiters', () => {
        const router = new FieldRouter({
            fields: ['foo1', 'foo2'],
            include_field_names: true,
            field_delimiter: ';',
            value_delimiter: ':'
        });

        const entity = new DataEntity({ foo1: 'bar1', foo2: 'bar2' });
        expect(router.lookup(entity)).toEqual('foo1:bar1;foo2:bar2');
    });

    it('should throw if given only no fields', () => {
        expect(() => {
            new FieldRouter({
                fields: []
            });
        }).toThrow('FieldRouter requires that at least one field');
    });
});
