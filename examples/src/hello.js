const { generate } = require('xylo');
const template = '<!DOCTYPE html><html><body><p x-text="message">Hello World</p><body></html>';
const data = {message: 'Hello Xylo!'};
const html = generate(template, data);
console.log(html); // `<!DOCTYPE html><html><body><p>Hello Xylo!</p><body></html>`
