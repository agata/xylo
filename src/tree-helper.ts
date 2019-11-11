import { Attribute, DefaultTreeElement, DefaultTreeNode, DefaultTreeTextNode, Node } from 'parse5';

const defaultTreeAdapter = require('parse5/lib/tree-adapters/default');
const treeAdapter = defaultTreeAdapter;

// traverse

export function getChildNodes(node: Node): Node[] {
    return treeAdapter.getChildNodes(node);
}

export function isElementNode(node: Node): boolean {
    return treeAdapter.isElementNode(node);
}

export function getAttrList(node: Node): Attribute[] {
    return treeAdapter.getAttrList(node);
}

export function findAttr(attrs: Attribute[], name: string): Attribute | undefined {
    return attrs.find((attr) => attr.name === name);
}

export function getParentNode(node: Node): Node {
    return treeAdapter.getParentNode(node);
}

export function getFirstChild(node: Node): Node {
    return treeAdapter.getFirstChild(node);
}

export function isBlankTextNode(node: DefaultTreeNode | undefined): boolean {
    if (!node || node.nodeName !== '#text') { return false; }

    return (node as DefaultTreeTextNode).value.trim().length === 0;
}

export function getPrevNode(node: DefaultTreeElement): Node | undefined {
    const parentNode = node.parentNode;
    if (!parentNode) { return undefined; }

    const index = parentNode.childNodes.indexOf(node);
    return parentNode.childNodes[index - 1];
}

// manipulation

export function createElement(name: string, ns: string): DefaultTreeElement {
    return treeAdapter.createElement(name, ns);
}

export function appendChild(parent: Node, child: Node): void {
    treeAdapter.appendChild(parent, child);
}

export function detachNode(node: Node): void {
    treeAdapter.detachNode(node);
}

export function replaceChildNodes(node: Node, newChildNodes: Node[]): void {
    const childNodes = getChildNodes(node);
    childNodes.splice(0, childNodes.length);
    newChildNodes.forEach((childNode) => childNodes.push(childNode));
}

export function setAttrValue(attrs: Attribute[], name: string, value: string): void {
    const attr = attrs.find((a) => a.name === name);
    if (attr) {
        if (value) {
            attr.value = value;
        } else {
            attrs.splice(attrs.indexOf(attr), 1);
        }
    } else {
        if (value) {
            attrs.push({name, value});
        }
    }
}

export function removeAttr(attrs: Attribute[], name: string): void {
    const attr = attrs.find((a) => a.name === name);
    if (attr) {
        attrs.splice(attrs.indexOf(attr), 1);
    }
}

export function insertChildNodes(parentNode: DefaultTreeElement, index: number, nodes: DefaultTreeNode[]): void {
    Array.prototype.splice.apply(parentNode.childNodes, ([index, 0] as any).concat(nodes));
}

// utils

export const escapeString: (str: string, attrMode: boolean) => string = require('parse5/lib/serializer').escapeString;
