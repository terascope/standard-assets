import 'jest-extended';
import {
    StorageRouter,
    DataRouter,
} from '../src';

describe('index', () => {
    it('should export StorageRouter', () => {
        expect(StorageRouter).toBeFunction();
    });

    it('should export DataRouter', () => {
        expect(DataRouter).toBeFunction();
    });
});
