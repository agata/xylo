import { Jexl } from 'jexl';
import {
    Attribute, DefaultTreeElement, DefaultTreeNode, Node, parse, parseFragment, serialize,
} from 'parse5';

import * as helper from './tree-helper';

const PARSE_OPTS = {sourceCodeLocationInfo: true};

export function generate(htmlTemplate: string, context: any, jexl: any = new Jexl()): string {
    const startNode = parse(htmlTemplate, PARSE_OPTS);
    processChildNodes(startNode, context, jexl);
    return serialize(startNode);
}

function processChildNodes(parentNode: Node, context: any, jexl: any) {
    const cloneChildNodes = [...helper.getChildNodes(parentNode)];

    if (cloneChildNodes) {
        for (let i = 0, cnLength = cloneChildNodes.length; i < cnLength; i++) {
            const currentNode = cloneChildNodes[i];

            if (helper.isElementNode(currentNode)) {
                processElement(currentNode as DefaultTreeElement, context, jexl);
            }
        }
    }
}

function processElement(node: DefaultTreeElement, context: any, jexl: any) {
    const clonedAttrs = [...helper.getAttrList(node)];

    for (const attr of clonedAttrs) {
        try {
            const directive = directives.find((d) => d.match(attr));
            if (directive) {
                const result = directive.process(node, attr, context, jexl);
                if (result.continue === false) {
                    return;
                }
            }
        } catch (e) {
            handleDirectiveError(e, node, attr);
        }
    }
    processChildNodes(node, context, jexl);
}

function handleDirectiveError(e: Error, node: DefaultTreeElement, attr?: Attribute) {
    let msg = node.nodeName;
    if (attr) {
        msg += '@' + attr.name;
    }
    if (node.sourceCodeLocation) {
        msg += `(Line:${node.sourceCodeLocation.startLine}, Col:${node.sourceCodeLocation.startCol})`;
    }
    msg += ' - ' + e;
    throw msg;
}

export interface Directive {
    match: (attr: Attribute) => boolean;
    process: (node: DefaultTreeElement, attr: Attribute, context: any, jexl: any) => DirectiveResult;
}

export interface DirectiveResult {
    continue: boolean;
}

const htmlDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-html';
    },
    process(node: DefaultTreeElement, attr: Attribute, context: any, jexl: any): DirectiveResult {
        const html = jexl.evalSync(attr.value, context);
        const fragments = helper.getChildNodes(parseFragment(html, PARSE_OPTS));
        helper.replaceChildNodes(node, fragments);
        helper.removeAttr(node.attrs, attr.name);
        return {continue: true};
    },
};

const textDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-text';
    },
    process(node: DefaultTreeElement, attr: Attribute, context: any, jexl: any): DirectiveResult {
        const rawText = jexl.evalSync(attr.value, context);
        const safeText = rawText ? helper.escapeString(rawText, false) : '';
        const fragments = helper.getChildNodes(parseFragment(safeText, PARSE_OPTS));
        helper.replaceChildNodes(node, fragments);
        helper.removeAttr(node.attrs, attr.name);
        return {continue: true};
    },
};

const attrDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name.startsWith('x-attr:');
    },
    process(node: DefaultTreeElement, attr: Attribute, context: any, jexl: any): DirectiveResult {
        const attrs = helper.getAttrList(node);
        const [, attrName] = attr.name.split(':').map((v) => v.trim());

        const newValue = jexl.evalSync(attr.value, context);
        helper.setAttrValue(attrs, attrName, newValue);
        helper.removeAttr(node.attrs, attr.name);
        return {continue: true};
    },
};

const ifDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-if';
    },
    process(node: DefaultTreeElement, attr: Attribute, context: any, jexl: any): DirectiveResult {
        const condtion = jexl.evalSync(attr.value, context);
        if (!condtion) {
            helper.detachNode(node);
            return {continue: false};
        }
        helper.removeAttr(node.attrs, attr.name);
        return {continue: true};
    },
};

const forDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-for';
    },
    process(node: DefaultTreeElement, attr: Attribute, context: any, jexl: any): DirectiveResult {
        const parentNode = helper.getParentNode(node) as DefaultTreeElement;
        const currentIndex = parentNode.childNodes.indexOf(node);
        const prevNode = helper.getPrevNode(node);
        const [itemName, itemsName] = attr.value.split('in').map((v) => v.trim());

        helper.detachNode(node);
        const items = jexl.evalSync(itemsName, context);
        if (items) {
            const newItemNodes = Array.from(items).map((item) => {
                // prepare new context for item
                const newContext = Object.assign({}, context);
                newContext[itemName] = item;

                // prepare new node for item
                const rootElement = helper.createElement('template', node.namespaceURI);
                helper.appendChild(rootElement, node);
                const fragments = parseFragment(serialize(rootElement), PARSE_OPTS);
                const newItemNode = helper.getFirstChild(fragments) as DefaultTreeElement;
                newItemNode.attrs = helper.getAttrList(newItemNode).filter((a) => a.name !== 'x-for');

                processElement(newItemNode as DefaultTreeElement, newContext, jexl);

                return newItemNode;
            });

            const newNodes = [] as DefaultTreeNode[];
            for (let i = 0, cnLength = newItemNodes.length; i < cnLength; i++) {
                // append node for indent and new line
                const newNode = newItemNodes[i];
                if (i !== 0 && helper.isBlankTextNode(prevNode as DefaultTreeNode)) {
                    newNodes.push(Object.assign({}, prevNode) as DefaultTreeNode);
                }

                newNodes.push(newNode);
            }
            helper.insertChildNodes(parentNode, currentIndex, newNodes);
        }
        return {continue: false};
    },
};

const directives = [
    htmlDirective,
    textDirective,
    attrDirective,
    ifDirective,
    forDirective,
];

export const testDirectives = {
    attr: attrDirective,
    for: forDirective,
    html: htmlDirective,
    if: ifDirective,
    text: textDirective,
};
