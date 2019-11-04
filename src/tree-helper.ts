import { Attribute, DefaultTreeElement, DefaultTreeNode, DefaultTreeTextNode, Node } from 'parse5';

const defaultTreeAdapter = require('parse5/lib/tree-adapters/default');
const treeAdapter = defaultTreeAdapter;

// traverse

export const getChildNodes = (node: Node): Node[] => {
    return treeAdapter.getChildNodes(node);
};

export const isElementNode = (node: Node): boolean => {
    return treeAdapter.isElementNode(node);
};

export const getAttrList = (node: Node): Attribute[] => {
    return treeAdapter.getAttrList(node);
};

export const getParentNode = (node: Node): Node => {
    return treeAdapter.getParentNode(node);
};

export const getFirstChild = (node: Node): Node => {
    return treeAdapter.getFirstChild(node);
};

export const createElement = (name: string, ns: string): DefaultTreeElement => {
    return treeAdapter.createElement(name, ns);
};

export const isBlankTextNode = (node: DefaultTreeNode | undefined): boolean => {
    if (!node || node.nodeName !== '#text') { return false; }

    return (node as DefaultTreeTextNode).value.trim().length === 0;
};

export const getPrevNode = (node: DefaultTreeElement): Node | undefined => {
    const parentNode = node.parentNode;
    if (!parentNode) { return undefined; }

    const index = parentNode.childNodes.indexOf(node);
    return parentNode.childNodes[index - 1];
};

// manipulation

export const appendChild = (parent: Node, child: Node): void => {
    treeAdapter.appendChild(parent, child);
};

export const detachNode = (node: Node): void => {
    treeAdapter.detachNode(node);
};

export const replaceChildNodes = (node: Node, newChildNodes: Node[]) => {
    const childNodes = getChildNodes(node);
    childNodes.splice(0, childNodes.length);
    newChildNodes.forEach((childNode) => childNodes.push(childNode));
};

export const setAttrValue = (attrs: Attribute[], name: string, value: string) => {
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
};

export const insertChildNodes = (parentNode: DefaultTreeElement, index: number, nodes: DefaultTreeNode[]) => {
    Array.prototype.splice.apply(parentNode.childNodes, ([index, 0] as any).concat(nodes));
};

// utils

export const escapeString: (str: string, attrMode: boolean) => string = require('parse5/lib/serializer').escapeString;
