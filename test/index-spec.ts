import path from 'path';
import fs from 'fs';
import processors = require('../asset/src');

const assetDir = path.join(__dirname, '..', 'asset', 'src');

describe('index', () => {
    it('should export every processor', () => {
        const processorDirs = fs.readdirSync(assetDir, { withFileTypes: true })
            .filter((i) => isProcessor(i.name))
            .map((i) => i.name);

        for (const p of processorDirs) {
            expect(p in processors.ASSETS).toBe(true);
        }
    });
});

function isProcessor(dirName: string) {
    try {
        return fs.readdirSync(path.join(assetDir, dirName)).includes('processor.ts');
    } catch (e) {
        return false;
    }
}
