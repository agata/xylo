import { Jexl } from 'jexl';
import {
    Attribute, DefaultTreeElement, DefaultTreeNode, DefaultTreeTextNode, Node, parse, parseFragment,
    serialize, TreeAdapter,
} from 'parse5';

const jexl = new Jexl();
const PARSE_OPTS = {sourceCodeLocationInfo: true};
const defaultTreeAdapter = require('parse5/lib/tree-adapters/default');

export function generate(htmlTemplate: string, data: any): string {
    return new Generator(htmlTemplate, data).generate();
}

class Generator {
    private htmlTemplate: string;
    private data: any;
    private treeAdapter: TreeAdapter;

    constructor(htmlTemplate: string, data: any) {
        this.htmlTemplate = htmlTemplate;
        this.data = data;
        this.treeAdapter =  defaultTreeAdapter;
    }

    public generate() {
        const startNode = parse(this.htmlTemplate, PARSE_OPTS);
        const context = this.data;
        this.processChildNodes(startNode, context);
        return serialize(startNode);
    }

    private processChildNodes(parentNode: Node, context: any) {
        const cloneChildNodes = [...this.treeAdapter.getChildNodes(parentNode)];

        if (cloneChildNodes) {
            for (let i = 0, cnLength = cloneChildNodes.length; i < cnLength; i++) {
                const currentNode = cloneChildNodes[i];

                if (this.treeAdapter.isElementNode(currentNode)) {
                    this.processElement(currentNode as DefaultTreeElement, context);
                }
            }
        }
    }

    private processElement(node: DefaultTreeElement, context: any) {
        const tn = this.treeAdapter.getTagName(node);
        const ns = this.treeAdapter.getNamespaceURI(node);
        const clonedAttrs = [...this.treeAdapter.getAttrList(node)];

        for (const attr of clonedAttrs) {
            if (attr.name === 'x-html') {
                const html = jexl.evalSync(attr.value, context);
                const fragments = this.treeAdapter.getChildNodes(parseFragment(html, PARSE_OPTS));
                replaceChildNodes(this.treeAdapter, node, fragments);
            }
            if (attr.name === 'x-text') {
                const rawText = jexl.evalSync(attr.value, context);
                const text = rawText ? escapeString(rawText, false) : '';
                const fragments = this.treeAdapter.getChildNodes(parseFragment(text, PARSE_OPTS));
                replaceChildNodes(this.treeAdapter, node, fragments);
            }
            if (attr.name.startsWith('x-bind:')) {
                const [xBind, attrName] = attr.name.split(':').map((v) => v.trim());
                const newValue = jexl.evalSync(attr.value, context);
                setAttrValue(clonedAttrs, attrName, newValue);
            }
            if (attr.name === 'x-if') {
                const condtion = jexl.evalSync(attr.value, context);
                if (!condtion) {
                    this.treeAdapter.detachNode(node);
                    return;
                }
            }
            if (attr.name === 'x-for') {
                const parentNode = this.treeAdapter.getParentNode(node) as DefaultTreeElement;
                const prevNode = getPrevNode(node);
                const currentIndex = parentNode.childNodes.indexOf(node);
                this.treeAdapter.detachNode(node);
                const [itemName, itemsName] = attr.value.split('in').map((v) => v.trim());
                const items = jexl.evalSync(itemsName, context);
                if (items) {
                    const newItemNodes = Array.from(items).flatMap((item) => {
                        const newContext = Object.assign({}, context);
                        newContext[itemName] = item;
                        const rootElement = this.treeAdapter.createElement('template', node.namespaceURI, []);
                        this.treeAdapter.appendChild(rootElement, node);
                        const fragments = parseFragment(serialize(rootElement), PARSE_OPTS);
                        const newItemNode = this.treeAdapter.getFirstChild(fragments) as DefaultTreeElement;
                        newItemNode.attrs = this.treeAdapter.getAttrList(newItemNode).filter((a) => a.name !== 'x-for');
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

const replaceChildNodes = (treeAdapter: TreeAdapter, node: Node, newChildNodes: Node[]) => {
    const childNodes = treeAdapter.getChildNodes(node);
    childNodes.splice(0, childNodes.length);
    newChildNodes.forEach((childNode) => childNodes.push(childNode));
};

const setAttrValue = (attrs: Attribute[], name: string, value: string) => {
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

const getPrevNode = (node: DefaultTreeElement): Node | undefined => {
    const parentNode = node.parentNode;
    if (!parentNode) { return undefined; }

    const index = parentNode.childNodes.indexOf(node);
    return parentNode.childNodes[index - 1];
};

const insertChildNodes = (parentNode: DefaultTreeElement, index: number, nodes: DefaultTreeNode[]) => {
    Array.prototype.splice.apply(parentNode.childNodes, ([index, 0] as any).concat(nodes));
};

const isBlankTextNode = (node: DefaultTreeNode | undefined): boolean => {
    if (!node || node.nodeName !== '#text') { return false; }

    return (node as DefaultTreeTextNode).value.trim().length === 0;
};

const escapeString: (str: string, attrMode: boolean) => string = require('parse5/lib/serializer').escapeString;
