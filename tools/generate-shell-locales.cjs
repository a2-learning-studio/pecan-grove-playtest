const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../assets/playtest/locales');
const data = Object.fromEntries(['en', 'es'].map(language => [language, JSON.parse(fs.readFileSync(path.join(dir, language + '.json'), 'utf8'))]));
fs.writeFileSync(path.join(dir, 'catalog.js'), '/* Generated from shell JSON locales. */\nwindow.PGShellLocale = ' + JSON.stringify(data) + ';\n');
