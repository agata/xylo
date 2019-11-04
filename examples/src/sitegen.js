const xylo = require('xylo');

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');

const data = {
    libs: [
        {
            name: "jexl",
            homepage: "https://github.com/TomFrost/Jexl",
            desc: "Javascript Expression Language: <strong>Powerful context-based</strong> expression parser and evaluator.",
        },
        {
            name: "parse5",
            homepage: "https://github.com/inikulin/parse5",
            desc: "<strong>HTML parsing/serialization toolset</strong>> for Node.js. WHATWG HTML Living Standard (aka HTML5)-compliant.",
        },
        {
            name: "xylo",
            homepage: "https://github.com/agata/xylo",
            desc: "Xylo.js is a static generator using <strong>pure HTML template</strong> like Vue.js.",
        },
    ]
};

if (!existsSync('./dist')) {
    mkdirSync('./dist');
}

// generate index.html
const indexTmpl = readFileSync('html/index.tmpl.html', 'utf-8');
const indexHtml = xylo.generate(indexTmpl, data);
writeFileSync(`dist/index.html`, indexHtml, 'utf8');

// generate {library name}.html
const libTmpl = readFileSync('html/library.tmpl.html', 'utf-8');
data.libs.forEach((lib) => {
    const libHtml = xylo.generate(libTmpl, lib);
    writeFileSync(`dist/${lib.name}.html`, libHtml, 'utf8');
});

