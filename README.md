# Xylo.js
Xylo.js is a static generator using pure HTML template like Vue.js.

## Installation


Install from npm:

    npm install xylo --save-dev


## Basic usage

```js
const xylo = require("xylo");
const html = xylo.generate(`<!DOCTYPE html><html><body><p x-text="message">Hello World</p><body></html>`, {message: 'Hello Xylo!'});
console.log(html); // `<!DOCTYPE html><html><body><p>Hello Xylo!</p><body></html>`
```

## Supported Directives

### x-text

#### Template

```html
<p x-text="message">Hello World</p>
```

```json
{
    "message": "Hello Xylo!"
}
```

#### HTML

```html
<p>Hello Xylo!</p>
```

### x-for

#### Template

```html
<ul>
    <li x-for="todo in todos"><span x-text="todo.title">Todo 1</span></p>
</ul>
```

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

#### HTML

```html
<ul>
    <li><span>Todo 1</span></p>
    <li><span>Todo 2</span></p>
    <li><span>Todo 3</span></p>
</ul>
```

### x-if

#### Template

```html
<li><span x-if="todo.done">✅</span><span x-text="todo.title">Todo 1</span></li>
```

```json
{
    "todo": {
        "done": false,
        "title": "Todo 3"
    }
}
```

#### HTML

```html
<li><span>Todo 3</span></li>
```

### x-bind

#### Template

```html
<img src="logo.png" x-bind:title="message"/>
```

```json
{
    "message": "Hello Xylo!"
}
```

#### HTML

```html
<img src="logo.png" title="Hello Xylo!" />
```

### x-html


#### Template

```html
<div x-html="description">This is a description.</div>
```

```json
{
    "description": "Xylo.js is a static generator using <strong>pure HTML template</strong> like Vue.js.",
}
```

#### HTML

```html
<div>Xylo.js is a static generator using <strong>pure HTML template</strong> like Vue.js.</div>
```

## Dependencies

* [jsdom](https://github.com/jsdom/jsdom) - A JavaScript implementation various web standards, for use with Node.js
* [Jexl](https://github.com/TomFrost/Jexl) - Javascript Expression Language: Powerful context-based expression parser and evaluator
* [JS Beautifier](https://beautifier.io) - Beautifier for javascript
* [escape-html](https://github.com/component/escape-html) - Escape string for use in HTML
