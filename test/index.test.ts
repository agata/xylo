import { readFileSync } from 'fs';
import { join } from 'path';

import { generate } from '../src/index';

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
    test('error expression', (): void => {
        const tmpl = `<!DOCTYPE html>
<html>
    <body>
        <a x-attr:href="this is error expression">error</a>
    </body>
</html>
`;
        const expected = 'a@x-attr:href(Line:4, Col:9) - Error: Token is  (identifier) unexpected in expression: this is ';
        try {
            const context = {};
            generate(tmpl, context);
            fail('should throw directive error');
        } catch (e) {
            expect(e.toString()).toBe(expected);
        }
    });
});
