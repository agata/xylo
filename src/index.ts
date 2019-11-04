import { Jexl } from 'jexl';
import { DefaultTreeElement, DefaultTreeNode, Node, parse, parseFragment, serialize } from 'parse5';

import {
    appendChild, createElement, detachNode, escapeString, getAttrList, getChildNodes, getFirstChild,
    getParentNode, getPrevNode, insertChildNodes, isBlankTextNode, isElementNode, replaceChildNodes,
    setAttrValue,
} from './tree-helper';

const jexl = new Jexl();
const PARSE_OPTS = {sourceCodeLocationInfo: true};

export function generate(htmlTemplate: string, data: any): string {
    return new Generator(htmlTemplate, data).generate();
}

class Generator {
    private htmlTemplate: string;
    private data: any;

    constructor(htmlTemplate: string, data: any) {
        this.htmlTemplate = htmlTemplate;
        this.data = data;
    }

    public generate() {
        const startNode = parse(this.htmlTemplate, PARSE_OPTS);
        const context = this.data;
        this.processChildNodes(startNode, context);
        return serialize(startNode);
    }

    private processChildNodes(parentNode: Node, context: any) {
        const cloneChildNodes = [...getChildNodes(parentNode)];

        if (cloneChildNodes) {
            for (let i = 0, cnLength = cloneChildNodes.length; i < cnLength; i++) {
                const currentNode = cloneChildNodes[i];

                if (isElementNode(currentNode)) {
                    this.processElement(currentNode as DefaultTreeElement, context);
                }
            }
        }
    }

    private processElement(node: DefaultTreeElement, context: any) {
        const clonedAttrs = [...getAttrList(node)];

        for (const attr of clonedAttrs) {
            if (attr.name === 'x-html') {
                const html = jexl.evalSync(attr.value, context);
                const fragments = getChildNodes(parseFragment(html, PARSE_OPTS));
                replaceChildNodes(node, fragments);
            }
            if (attr.name === 'x-text') {
                const rawText = jexl.evalSync(attr.value, context);
                const text = rawText ? escapeString(rawText, false) : '';
                const fragments = getChildNodes(parseFragment(text, PARSE_OPTS));
                replaceChildNodes(node, fragments);
            }
            if (attr.name.startsWith('x-bind:')) {
                const [xBind, attrName] = attr.name.split(':').map((v) => v.trim());
                const newValue = jexl.evalSync(attr.value, context);
                setAttrValue(clonedAttrs, attrName, newValue);
            }
            if (attr.name === 'x-if') {
                const condtion = jexl.evalSync(attr.value, context);
                if (!condtion) {
                    detachNode(node);
                    return;
                }
            }
            if (attr.name === 'x-for') {
                const parentNode = getParentNode(node) as DefaultTreeElement;
                const prevNode = getPrevNode(node);
                const currentIndex = parentNode.childNodes.indexOf(node);
                detachNode(node);
                const [itemName, itemsName] = attr.value.split('in').map((v) => v.trim());
                const items = jexl.evalSync(itemsName, context);
                if (items) {
                    const newItemNodes = Array.from(items).flatMap((item) => {
                        const newContext = Object.assign({}, context);
                        newContext[itemName] = item;
                        const rootElement = createElement('template', node.namespaceURI);
                        appendChild(rootElement, node);
                        const fragments = parseFragment(serialize(rootElement), PARSE_OPTS);
                        const newItemNode = getFirstChild(fragments) as DefaultTreeElement;
                        newItemNode.attrs = getAttrList(newItemNode).filter((a) => a.name !== 'x-for');
                        this.processElement(newItemNode as DefaultTreeElement, newContext);
                        return [newItemNode];
                    });

                    // append indent and new line
                    const newNodes = [] as DefaultTreeNode[];
                    for (let i = 0, cnLength = newItemNodes.length; i < cnLength; i++) {
                        const newNode = newItemNodes[i];
                        if (i !== 0 && isBlankTextNode(prevNode as DefaultTreeNode)) {
                            newNodes.push(Object.assign({}, prevNode) as DefaultTreeNode);
                        }
                        newNodes.push(newNode);
                    }
                    insertChildNodes(parentNode, currentIndex, newNodes);
                }
                return;
            }
        }

        node.attrs = clonedAttrs.filter((attr) => !attr.name.startsWith('x-'));
        this.processChildNodes(node, context);
    }
}
