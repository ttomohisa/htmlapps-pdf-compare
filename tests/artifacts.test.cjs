const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {gunzipSync}=require('node:zlib');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
const appScript=html=>html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const stylesheet=html=>html.match(/<style>([\s\S]*?)<\/style>/)[1];
const data=(html,id)=>html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`))[1];
const source=read('src/index.template.html');
function templateShape(html){
 for(const [id,placeholder] of [['app-config','__APP_CONFIG_JSON__'],['build-manifest','__BUILD_MANIFEST_JSON__'],['embedded-assets','__EMBEDDED_ASSET_BUNDLE_GZIP_BASE64__']]){
  html=html.replace(new RegExp(`(<script[^>]*id="${id}"[^>]*>)[\\s\\S]*?(<\\/script>)`),`$1${placeholder}$2`);
 }
 return html;
}
test('tracked standalone has the current application and styles',()=>{
 const html=read('pdf-compare.html');
 assert.equal(templateShape(html),source);
 assert.equal(appScript(html),appScript(source));assert.equal(stylesheet(html),stylesheet(source));
 assert.deepEqual(JSON.parse(data(html,'app-config')),JSON.parse(read('app.config.json')));
 assert.match(html,/connect-src 'none'/);
});
test('generated standalone and self-extract match the tracked runtime',()=>{
 const html=read('dist/index.html'),tracked=read('pdf-compare.html'),wrapper=read('dist/index.self-extract.html');
 assert.equal(templateShape(html),source);
 assert.equal(appScript(html),appScript(source));assert.equal(stylesheet(html),stylesheet(source));
 assert.deepEqual(JSON.parse(data(html,'app-config')),JSON.parse(data(tracked,'app-config')));
 const bundle=x=>JSON.parse(gunzipSync(Buffer.from(data(x,'embedded-assets'),'base64')).toString('utf8'));
 assert.deepEqual(bundle(html),bundle(tracked));
 assert.equal(gunzipSync(Buffer.from(data(wrapper,'self-extract-payload'),'base64')).toString('utf8').replace(/\r\n/g,'\n'),html);
});
