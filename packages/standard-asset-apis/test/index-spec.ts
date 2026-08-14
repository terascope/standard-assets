import 'jest-extended';
import {
    DateRouter,
    FieldRouter,
    HashRouter,
    KeyRouter,
} from '../src/index.js';

describe('index', () => {
    it('should export DateRouter', () => {
        expect(DateRouter).toBeFunction();
    });

    it('should export FieldRouter', () => {
        expect(FieldRouter).toBeFunction();
    });

    it('should export HashRouter', () => {
        expect(HashRouter).toBeFunction();
    });

    it('should export KeyRouter', () => {
        expect(KeyRouter).toBeFunction();
    });
});
