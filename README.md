# Xylo.js

Xylo.js is a static site generator using pure HTML template like Vue.js and Thymeleaf.

## Installation

Install from npm:

    npm install xylo


## Basic usage

```js
const { generate } = require('xylo');
const template = '<!DOCTYPE html><html><body><p x-text="message">Hello World</p><body></html>';
const data = {message: 'Hello Xylo!'};
const html = generate(template, data);
console.log(html); // `<!DOCTYPE html><html><body><p>Hello Xylo!</p><body></html>`
```

## Supported directives

### x-text

Template:
```html
<p x-text="message">Hello World</p>
```

Data:
```json
{
    "message": "Hello Xylo!"
}
```

HTML:
```html
<p>Hello Xylo!</p>
```

### x-for

Template:
```html
<ul>
    <li x-for="todo in todos"><span x-text="todo.title">Todo 1</span></li>
</ul>
```

Data:
```json
{
    "todos": [
        {
            "title": "Todo1"
        },
        {
            "title": "Todo2"
        },
        {
            "title": "Todo3"
        },
    ]
}
```

HTML:
```html
<ul>
    <li><span>Todo 1</span></li>
    <li><span>Todo 2</span></li>
    <li><span>Todo 3</span></li>
</ul>
```

### x-if

Template:
```html
<span x-if="todo1.done">✅</span><span x-text="todo1.title">Todo 0</span>
<span x-if="todo2.done">✅</span><span x-text="todo2.title">Todo 0</span>
```

Data:
```json
{
    "todo1": {
        "done": true,
        "title": "Todo 1"
    },
    "todo2": {
        "done": false,
        "title": "Todo 2"
    }
}
```

HTML:
```html
<span>✅</span><span>Todo 1</span>
<span>Todo 2</span>
```

### x-attr

Template:
```html
<img src="logo.png" x-attr:title="message"/>
```

Data:
```json
{
    "message": "Hello Xylo!"
}
```

HTML:
```html
<img src="logo.png" title="Hello Xylo!" />
```

### x-html

Template:
```html
<div x-html="description">This is a description.</div>
```

Data:
```json
{
    "description": "Xylo.js is a static site generator using <strong>pure HTML template</strong> like Vue.js and Thymeleaf.",
}
```

HTML:
```html
<div>Xylo.js is a static site generator using <strong>pure HTML template</strong> like Vue.js and Thymeleaf.</div>
```

## Dependencies

* [parse5](https://github.com/inikulin/parse5) - HTML parsing/serialization toolset for Node.js. WHATWG HTML Living Standard (aka HTML5)-compliant.
* [Jexl](https://github.com/TomFrost/Jexl) - Javascript Expression Language: Powerful context-based expression parser and evaluator.
