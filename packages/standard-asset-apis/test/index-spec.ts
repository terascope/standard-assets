import 'jest-extended';
import {
    KeyRouter,
} from '../src';

describe('index', () => {
    it('should export KeyRouter', () => {
        expect(KeyRouter).toBeFunction();
    });
});
