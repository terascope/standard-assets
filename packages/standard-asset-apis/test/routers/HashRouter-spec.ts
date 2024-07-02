import { DataEntity } from '@terascope/utils';
import 'jest-extended';
import {
    HashRouter
} from '../../src/index.js';

describe('HashRouter', () => {
    it('should work with one no fields and 4 partitions', () => {
        const router = new HashRouter({
            partitions: 4,
        });

        const entity1 = new DataEntity({ foo: 'bar' });
        const entity2 = new DataEntity({ foo: 'bar' });
        entity1.setKey('bacon');
        entity2.setKey('frypan');

        expect([
            router.lookup(entity1),
            router.lookup(entity2),
        ]).toEqual(['0', '3']);
    });

    it('should work with one field and 4 partitions', () => {
        const router = new HashRouter({
            partitions: 4,
            fields: ['foo']
        });

        expect([
            router.lookup(new DataEntity({
                foo: 'cheese'
            })),
            router.lookup(new DataEntity({
                foo: '12347'
            }))
        ]).toEqual([
            '0',
            '2',
        ]);
    });

    it('should throw if given only no fields', () => {
        expect(() => {
            new HashRouter({
                partitions: 'abc' as any
            });
        }).toThrow('Expected partitions to be integer > 0, got "abc" (String)');
    });
});
