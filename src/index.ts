import { Jexl } from 'jexl';
import {
    Attribute, DefaultTreeElement, DefaultTreeNode, Node, parse, parseFragment, serialize,
} from 'parse5';

import * as helper from './tree-helper';

const jexl = new Jexl();
const PARSE_OPTS = {sourceCodeLocationInfo: true};

export function generate(htmlTemplate: string, data: any): string {
    const startNode = parse(htmlTemplate, PARSE_OPTS);
    const context = data;
    processChildNodes(startNode, context);
    return serialize(startNode);
}

const processChildNodes = (parentNode: Node, context: any) => {
    const cloneChildNodes = [...helper.getChildNodes(parentNode)];

    if (cloneChildNodes) {
        for (let i = 0, cnLength = cloneChildNodes.length; i < cnLength; i++) {
            const currentNode = cloneChildNodes[i];

            if (helper.isElementNode(currentNode)) {
                processElement(currentNode as DefaultTreeElement, context);
            }
        }
    }
};

const processElement = (node: DefaultTreeElement, context: any) => {
    const clonedAttrs = [...helper.getAttrList(node)];

    for (const attr of clonedAttrs) {
        try {
            const directive = directives.find((d) => d.match(attr));
            if (directive) {
                const result = directive.process(node, clonedAttrs, attr, context);
                if (result.skipChildNodes) {
                    return;
                }
            }
        } catch (e) {
            handleDirectiveError(e, node, attr);
        }
    }

    node.attrs = clonedAttrs.filter((attr) => !attr.name.startsWith('x-'));
    processChildNodes(node, context);
};

const handleDirectiveError = (e: Error, node: DefaultTreeElement, attr?: Attribute) => {
    let message = node.nodeName;
    if (attr) {
        message += '@' + attr.name;
    }
    if (node.sourceCodeLocation) {
        message += `(Line:${node.sourceCodeLocation.startLine}, Col:${node.sourceCodeLocation.startCol})`;
    }
    message += ' - ' + e;
    throw message;
};

interface Directive {
    match: (attr: Attribute) => boolean;
    process: (node: DefaultTreeElement, attrs: Attribute[], attr: Attribute, context: any) => DirectiveResult;
}

interface DirectiveResult {
    skipChildNodes: boolean;
}

const htmlDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-html';
    },
    process(node: DefaultTreeElement, attrs: Attribute[], attr: Attribute, context: any): DirectiveResult {
        const html = jexl.evalSync(attr.value, context);
        const fragments = helper.getChildNodes(parseFragment(html, PARSE_OPTS));
        helper.replaceChildNodes(node, fragments);
        return {skipChildNodes: false};
    },
};

const textDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-text';
    },
    process(node: DefaultTreeElement, attrs: Attribute[], attr: Attribute, context: any): DirectiveResult {
        const rawText = jexl.evalSync(attr.value, context);
        const text = rawText ? helper.escapeString(rawText, false) : '';
        const fragments = helper.getChildNodes(parseFragment(text, PARSE_OPTS));
        helper.replaceChildNodes(node, fragments);
        return {skipChildNodes: false};
    },
};

const attrDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name.startsWith('x-attr:');
    },
    process(node: DefaultTreeElement, attrs: Attribute[], attr: Attribute, context: any): DirectiveResult {
        const [, attrName] = attr.name.split(':').map((v) => v.trim());
        const newValue = jexl.evalSync(attr.value, context);
        helper.setAttrValue(attrs, attrName, newValue);
        return {skipChildNodes: false};
    },
};

const ifDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-if';
    },
    process(node: DefaultTreeElement, attrs: Attribute[], attr: Attribute, context: any): DirectiveResult {
        const condtion = jexl.evalSync(attr.value, context);
        if (!condtion) {
            helper.detachNode(node);
            return {skipChildNodes: true};
        }
        return {skipChildNodes: false};
    },
};

const forDirective: Directive = {
    match(attr: Attribute): boolean {
        return attr.name === 'x-for';
    },
    process(node: DefaultTreeElement, attrs: Attribute[], attr: Attribute, context: any): DirectiveResult {
        const parentNode = helper.getParentNode(node) as DefaultTreeElement;
        const prevNode = helper.getPrevNode(node);
        const currentIndex = parentNode.childNodes.indexOf(node);
        helper.detachNode(node);
        const [itemName, itemsName] = attr.value.split('in').map((v) => v.trim());
        const items = jexl.evalSync(itemsName, context);
        if (items) {
            const newItemNodes = Array.from(items).flatMap((item) => {
                const newContext = Object.assign({}, context);
                newContext[itemName] = item;
                const rootElement = helper.createElement('template', node.namespaceURI);
                helper.appendChild(rootElement, node);
                const fragments = parseFragment(serialize(rootElement), PARSE_OPTS);
                const newItemNode = helper.getFirstChild(fragments) as DefaultTreeElement;
                newItemNode.attrs = helper.getAttrList(newItemNode).filter((a) => a.name !== 'x-for');
                processElement(newItemNode as DefaultTreeElement, newContext);
                return [newItemNode];
            });

            // append indent and new line
            const newNodes = [] as DefaultTreeNode[];
            for (let i = 0, cnLength = newItemNodes.length; i < cnLength; i++) {
                const newNode = newItemNodes[i];
                if (i !== 0 && helper.isBlankTextNode(prevNode as DefaultTreeNode)) {
                    newNodes.push(Object.assign({}, prevNode) as DefaultTreeNode);
                }
                newNodes.push(newNode);
            }
            helper.insertChildNodes(parentNode, currentIndex, newNodes);
        }
        return {skipChildNodes: true};
    },
};

const directives = [
    htmlDirective,
    textDirective,
    attrDirective,
    ifDirective,
    forDirective,
];
