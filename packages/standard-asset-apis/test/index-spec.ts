import 'jest-extended';
import {
    KeyRouter,
} from '../src/index.js';

describe('index', () => {
    it('should export KeyRouter', () => {
        expect(KeyRouter).toBeFunction();
    });
});
