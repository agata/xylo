import { readFileSync } from 'fs';
import {
    DefaultTreeElement, parseFragment, serialize,
} from 'parse5';
import { join } from 'path';

import { Directive, DirectiveResult, generate, testDirectives } from '../src/index';
import * as helper from '../src/tree-helper';

const defaultTreeAdapter = require('parse5/lib/tree-adapters/default');
const treeAdapter = defaultTreeAdapter;

function readFile(filePath: string): string {
    return readFileSync(
        join(__dirname, filePath),
        'utf-8',
    );
}

function readJson(filePath: string): any {
    return JSON.parse(readFile(filePath));
}

describe('generate', (): void => {
    test('generate with all directives', (): void => {
        const tmpl = readFile('res/all.tmpl.html');
        const expected = readFile('res/all.html');
        const context = readJson('res/all.json');
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

describe('directives', (): void => {
    const testDirective = (
        directive: Directive,
        tmpl: string,
        tagName: string,
        context: any,
        expectedHtml: string,
        expectedResult: DirectiveResult) => {
        const fragments = parseFragment(tmpl);
        const topNode = helper.getFirstChild(fragments) as DefaultTreeElement;
        const attrs = helper.getAttrList(topNode);
        const attr = helper.findAttr(attrs, tagName);

        if (attr) {
            expect(directive.match(attr)).toBe(true);

            const result = directive.process(topNode, attr, context);
            expect(result.continue).toBe(expectedResult.continue);

            const rootElement = helper.createElement('template', topNode.namespaceURI);
            for (const child of helper.getChildNodes(fragments)) {
                helper.appendChild(rootElement, child);
            }
            expect(serialize(rootElement, treeAdapter)).toBe(expectedHtml);
        } else {
            fail();
        }
    };

    test('htmlDirective', (): void => {
        const directive = testDirectives.html;
        const tmpl = '<h1 x-html="desc">desc</h1>';
        const expectedHtml = '<h1><strong>Header</strong></h1>';
        const context = { desc: '<strong>Header</strong>' };
        const tagName = 'x-html';
        const expectedResult = { continue: true } as DirectiveResult;
        testDirective(
            directive,
            tmpl,
            tagName,
            context,
            expectedHtml,
            expectedResult,
        );
    });
    test('textDrective', (): void => {
        const directive = testDirectives.text;
        const tmpl = '<h1 x-text="desc">desc</h1>';
        const expectedHtml = '<h1>&lt;string&gt;Header&lt;/string&gt;</h1>';
        const context = { desc: '<string>Header</string>' };
        const tagName = 'x-text';
        const expectedResult = { continue: true } as DirectiveResult;
        testDirective(
            directive,
            tmpl,
            tagName,
            context,
            expectedHtml,
            expectedResult,
        );
    });
    test('attrDrective', (): void => {
        const directive = testDirectives.attr;
        const tmpl = '<a x-attr:src="link">Link</a>';
        const expectedHtml = '<a src="https://github.com/">Link</a>';
        const context = { link: 'https://github.com/' };
        const tagName = 'x-attr:src';
        const expectedResult = { continue: true } as DirectiveResult;
        testDirective(
            directive,
            tmpl,
            tagName,
            context,
            expectedHtml,
            expectedResult,
        );
    });
    test('ifDrective: false', (): void => {
        const directive = testDirectives.if;
        const tmpl = '<a x-if="flg">hoge</a>';
        const expectedHtml = '';
        const context = { flg: false };
        const tagName = 'x-if';
        const expectedResult = { continue: false } as DirectiveResult;
        testDirective(
            directive,
            tmpl,
            tagName,
            context,
            expectedHtml,
            expectedResult,
        );
    });
    test('ifDrective: true', (): void => {
        const directive = testDirectives.if;
        const tmpl = '<a x-if="flg">hoge</a>';
        const expectedHtml = '<a>hoge</a>';
        const context = { flg: true };
        const tagName = 'x-if';
        const expectedResult = { continue: true } as DirectiveResult;
        testDirective(
            directive,
            tmpl,
            tagName,
            context,
            expectedHtml,
            expectedResult,
        );
    });
    test('forDrective: 3 items', (): void => {
        const directive = testDirectives.for;
        const tmpl = '<li x-for="item in items"><span x-text="item.name">text</span></li>';
        const expectedHtml = '<li><span>1</span></li><li><span>2</span></li><li><span>3</span></li>';
        const context = { items: [{name: '1'}, {name: '2'}, {name: '3'}] };
        const tagName = 'x-for';
        const expectedResult = { continue: false } as DirectiveResult;
        testDirective(
            directive,
            tmpl,
            tagName,
            context,
            expectedHtml,
            expectedResult,
        );
    });
    test('forDrective: empty items', (): void => {
        const directive = testDirectives.for;
        const tmpl = '<li x-for="item in items"><span x-text="item.name">text</span></li>';
        const expectedHtml = '';
        const context = { items: [] };
        const tagName = 'x-for';
        const expectedResult = { continue: false } as DirectiveResult;
        testDirective(
            directive,
            tmpl,
            tagName,
            context,
            expectedHtml,
            expectedResult,
        );
    });
});
