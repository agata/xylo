import { generate } from '../src/index';
import { readFileSync } from 'fs';
import { join } from 'path';

function readFile(filePath: string): string {
    return readFileSync(
        join(__dirname, filePath),
        'utf-8',
    );
}

function readJson(filePath: string): any {
    return JSON.parse(readFile(filePath));
}

describe('render', (): void => {
    test('generate with all directives', (): void => {
        const tmpl = readFile('res/all.tmpl.html');
        const expected = readFile('res/all.html');
        const context = readJson('res/all.json');
        const html = generate(tmpl, context);

        expect(html).toBe(expected);
    });
    test('if directive', (): void => {
        const tmpl = '<html><body><p x-if="false">Remove Me</p></body></html>';
        const expected = '<html><head></head><body></body></html>';
        const context = {};
        const html = generate(tmpl, context);

        expect(html).toBe(expected);
    });
});
