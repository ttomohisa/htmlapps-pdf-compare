// Source CSS contracts; actual browser geometry and file flows are verified separately.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/index.template.html'),'utf8');
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
test('open dialogs use a shrinking body instead of fixed header-height subtraction',()=>{
 assert.match(css,/dialog\[open\]\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column/);
 assert.match(css,/\.dialog-body\s*\{[^}]*min-height:\s*0[^}]*flex:\s*1\s+1\s+auto/);
 assert.doesNotMatch(css,/\.dialog-body\s*\{[^}]*max-height:\s*calc\(100dvh\s*-\s*102px\)/);
});
test('password form shares the capped dialog height so its actions remain reachable',()=>{
 assert.match(css,/#passwordForm\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*min-height:\s*0/);
});
test('narrow comparison toolbar keeps existing PNG and CSV exports available',()=>{
 const mobile=css.slice(css.indexOf('@media(max-width:760px)'),css.indexOf('@media(max-width:430px)'));
 assert.doesNotMatch(mobile,/\.actions\s*\{[^}]*display:\s*none/);
 assert.match(mobile,/\.toolbar\s*\{[^}]*flex-wrap:\s*wrap/);
});
test('long filenames cannot enlarge upload grid tracks',()=>{
 assert.doesNotMatch(css,/\.upload-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
 assert.match(css,/\.drop\s*\{[^}]*min-width:\s*0/);
 assert.match(css,/#passwordMessage\s*\{[^}]*overflow-wrap:\s*anywhere/);
});
test('modal dialogs lock document scrolling',()=>{
 assert.match(css,/html:has\(dialog\[open\]\)\s*\{[^}]*overflow:\s*hidden/);
});
