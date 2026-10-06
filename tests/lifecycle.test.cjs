const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const path=require('node:path');
const sourcePath=process.env.PDF_COMPARE_HTML || path.join(__dirname,'../src/index.template.html');
const html=fs.readFileSync(sourcePath,'utf8');
const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const exposed=source.replace(/\}\)\(\);\s*$/,'globalThis.probe={S,loadPdf,compare,resetAll,acceptFile,detailed,selectPair,currentDetail,renderPage,analyze,navigate,saveDiffPng,exportCsv,visible,detailSettings};})();');
function deferred(){let resolve,reject;let promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};}
async function flush(n=12){for(let i=0;i<n;i++)await new Promise(r=>setImmediate(r));}
function harness(language='en'){
 const docListeners={},elements=new Map(),errors=[],canvases=[],timerCallbacks=[],downloads=[];
 class Element {
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.style={};this.dataset={};this.children=[];this.listeners={};this.value='';this.checked=false;this.hidden=false;this.open=false;this.textContent='';this.clientWidth=1000;const classes=new Set();this.classList={add(...names){names.forEach(name=>classes.add(name))},remove(...names){names.forEach(name=>classes.delete(name))},contains(name){return classes.has(name)},toggle(name,force){const on=force??!classes.has(name);if(on)classes.add(name);else classes.delete(name);return on}};this._html='';}
  set innerHTML(s){this._html=s;this.children=[];}
  get innerHTML(){return this._html;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  fire(type,event={}){return Promise.all((this.listeners[type]||[]).map(fn=>fn(event)));}
  setAttribute(name,value){this[name]=value;} appendChild(e){this.children.push(e);return e;} remove(){} click(){return this.fire("click");} focus(){} showModal(){this.open=true;}close(){this.open=false;}scrollTo(){}
  querySelectorAll(selector){const result=[];for(const c of this.children){if(selector==='canvas'&&c.tagName==='CANVAS')result.push(c);result.push(...c.querySelectorAll(selector));}return result;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  getContext(){const c=this;return {fillRect(){},drawImage(src){c.drawnFrom=src;},getImageData(x,y,w,h){if(w*h>1e6)throw Error('Harness bounded pixel allocation');return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
 }
 function $(id){if(!elements.has(id)){
  const markup=html.match(new RegExp('<([a-z]+)[^>]*\\bid="'+id+'"[^>]*>'));
  const e=new Element(markup?.[1]);
  for(const [,key,value] of markup?.[0].matchAll(/data-([a-z0-9-]+)="([^"]*)"/g)||[])e.dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
  elements.set(id,e);
 }return elements.get(id);}
 $('app-config').textContent=JSON.stringify({name:'Test',version:'1'});$('build-manifest').textContent='{}';$('quality').value='standard';$('threshold').value='24';$('minRegion').value='8';
 const document={getElementById:$,documentElement:{},querySelectorAll(selector){
  if(selector==='dialog[open]')return [...elements.values()].filter(e=>e.tagName==='DIALOG'&&e.open);
  if(selector==='[data-i18n]')return [...elements.values()].filter(e=>e.dataset.i18n);
  if(selector==='[data-i18n-title]')return [...elements.values()].filter(e=>e.dataset.i18nTitle);
  return [];
 },createElement(tag){const e=new Element(tag);if(tag==='canvas'){e.width=300;e.height=150;canvases.push(e);}return e;},addEventListener(type,fn){(docListeners[type]??=[]).push(fn)},body:new Element('body')};
 const context={document,navigator:{language},console:{error(e){errors.push(String(e));},warn(){}},window:{addEventListener(){}},innerWidth:1000,location:{protocol:'https:'},setTimeout(fn,ms){if(ms<=5)return setImmediate(fn);timerCallbacks.push(fn);return timerCallbacks.length;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},requestAnimationFrame(fn){fn();},URL:{createObjectURL(blob){downloads.push(blob);return "blob:test"},revokeObjectURL(){}},Blob,Response,Uint8Array,Uint8ClampedArray,ImageData:class {constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}},Intl};
 vm.createContext(context);vm.runInContext(exposed,context,{filename:sourcePath});return {...context.probe,$,errors,canvases,context,timerCallbacks,downloads,fireDocument:(type,event)=>Promise.all((docListeners[type]||[]).map(fn=>fn(event)))};
}
function file(name){return {name,type:'application/pdf',size:12,arrayBuffer:async()=>new ArrayBuffer(8)};}
function page(gate=null){return {cleanupCalls:0,cancelCalls:0,getViewport({scale}){return {width:612*scale,height:180*scale};},getTextContent:async()=>({items:[{str:'synthetic'}]}),cleanup(){this.cleanupCalls++;},render(){return {promise:gate?gate.promise:Promise.resolve(),cancel:()=>this.cancelCalls++};}};}
function doc(name,p=page()){return {name,numPages:1,destroyCalls:0,getPage:async()=>p,async destroy(){this.destroyCalls++;}};}

function engine(h,entries){let n=0;const tasks=[];h.S.pdfjs={PasswordResponses:{INCORRECT_PASSWORD:2},getDocument(options){const entry=entries[n++];const task={options,promise:entry?.promise || Promise.resolve(entry),destroyCalls:0,async destroy(){this.destroyCalls++; if(entry?.destroy) await entry.destroy();}};tasks.push(task);return task;}};return tasks;}
async function setup(entries){const h=harness();h.S.oldFile=file('before.pdf');h.S.newFile=file('after.pdf');const tasks=engine(h,entries);await h.compare();return {h,tasks};}
for(const side of ['old','new'])test(`replacement of ${side} destroys both prior documents once`,async()=>{
 const a=doc('old'),b=doc('new');const {h,tasks}=await setup([a,b,doc('a2'),doc('b2')]);
 h.acceptFile(side,file('replacement.pdf'));await flush();assert.equal(a.destroyCalls,1);assert.equal(b.destroyCalls,1);assert.equal(tasks[0].destroyCalls,1);await h.resetAll();assert.equal(a.destroyCalls,1);
});
test('a failed load destroys its successfully loaded sibling',async()=>{
 const a=doc('success');const failure=deferred();const h=harness();h.S.oldFile=file('valid.pdf');h.S.newFile=file('invalid.pdf');const tasks=engine(h,[a,failure]);const pending=h.compare();await flush();failure.reject(Error('invalid PDF'));await pending;assert.equal(a.destroyCalls,1);assert.equal(tasks[1].destroyCalls,1);assert.equal(h.S.oldDoc,null);await h.resetAll();assert.equal(a.destroyCalls,1);
});
test('reset destroys pending loads and late completion cannot restore comparison',async()=>{
 const a=deferred(),b=deferred(),h=harness();h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');const tasks=engine(h,[a,b]);const pending=h.compare();await flush();await h.resetAll();assert.deepEqual(tasks.map(t=>t.destroyCalls),[1,1]);a.resolve(doc('a'));b.resolve(doc('b'));await pending;assert.equal(h.S.pairs.length,0);assert.equal(h.S.oldDoc,null);assert.equal(h.$('status').textContent,'Choose two PDF files.');
});
test('reset before file bytes resolve does not start a loading task',async()=>{
 const h=harness(),bytes=deferred();h.S.oldFile={...file('slow.pdf'),arrayBuffer:()=>bytes.promise};h.S.newFile=file('b.pdf');const tasks=engine(h,[doc('new')]);const pending=h.compare();await flush();await h.resetAll();bytes.resolve(new ArrayBuffer(8));await pending;assert.equal(tasks.length,1);assert.equal(h.S.pairs.length,0);
});
async function readyAdded(){const {h,tasks}=await setup([doc('empty'),doc('after')]);h.S.pairs=[{status:'added',newIndex:1,textSimilarity:0,quickDiff:1,changed:true}];h.S.detailed.clear();return {h,tasks};}
test('new quality wins over an older same-page render and cancels it',async()=>{
 const {h}=await readyAdded(),gate=deferred(),slow=page(gate),fast=page();let n=0;h.S.newDoc.getPage=async()=>++n===1?slow:fast;
 const pending=h.selectPair(0);await flush();h.$('quality').value='high';await h.$('quality').fire('change');await flush();assert.equal(h.$('stage').querySelector('canvas').width,1500);gate.resolve();await pending;assert.equal(h.$('stage').querySelector('canvas').width,1500);assert.equal(h.S.detailed.size,1);assert.equal(slow.cancelCalls,1);assert.equal(slow.cleanupCalls,1);
});
test('reset during rendering keeps cache and viewer empty after late result',async()=>{
 const {h}=await readyAdded(),gate=deferred(),slow=page(gate);h.S.newDoc.getPage=async()=>slow;const pending=h.selectPair(0);await flush();await h.resetAll();gate.resolve();await pending;assert.equal(h.S.detailed.size,0);assert.equal(h.$('stage').querySelectorAll('canvas').length,0);assert.equal(slow.cancelCalls,1);assert.equal(slow.cleanupCalls,1);
});
test('older render error cannot replace the newer successful view',async()=>{
 const {h}=await readyAdded(),gate=deferred();let n=0;h.S.newDoc.getPage=async()=>++n===1?page(gate):page();const pending=h.selectPair(0);await flush();h.$('quality').value='high';await h.$('quality').fire('change');await flush();gate.reject(Error('old render failed'));await pending;assert.equal(h.$('stage').querySelector('canvas')?.width,1500);
});
test('threshold invalidation is immediate, before debounce',async()=>{
 const {h}=await readyAdded(),gate=deferred(),slow=page(gate);h.S.newDoc.getPage=async()=>slow;const pending=h.selectPair(0);await flush();h.$('threshold').value='40';await h.$('threshold').fire('input');gate.resolve();await pending;assert.equal(h.S.detailed.size,0);assert.equal(h.$('stage').querySelectorAll('canvas').length,0);assert.equal(slow.cancelCalls,1);
});
test('navigation and changed-only handlers use visible page indexes',async()=>{
 const {h}=await readyAdded();h.S.pairs.push({...h.S.pairs[0],newIndex:2});assert.doesNotThrow(()=>h.navigate(1));await flush();assert.equal(h.S.current,1);h.S.pairs[1].changed=false;h.$('changedOnly').checked=true;await h.$('changedOnly').fire('change');await flush();assert.equal(h.S.current,0);
});

test('document tasks receive the engine-owned PDF worker explicitly',async()=>{
 const h=harness(),worker={destroy(){throw Error('shared worker must survive')}};h.S.pdfWorker=worker;h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');const tasks=engine(h,[doc('a'),doc('b')]);await h.compare();assert.equal(tasks[0].options.worker,worker);assert.equal(tasks[1].options.worker,worker);await h.resetAll();
});

test('new comparison survives a late failure from replaced inputs',async()=>{
 const h=harness(),a=deferred(),b=deferred();h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');engine(h,[a,b,doc('new-a'),doc('new-b')]);const old=h.compare();await flush();h.acceptFile('old',file('replacement.pdf'));await flush();const current=h.S.oldDoc;assert.equal(current?.name,'new-a');a.reject(Error('obsolete failure'));b.resolve(doc('late'));await old;assert.equal(h.S.oldDoc,current);assert.match(h.$('status').textContent,/Comparison is ready/);assert.equal(h.errors.length,0);
});
test('slow document teardown never clears a newer selection',async()=>{
 const teardown=deferred(),a=doc('old');a.destroy=()=>teardown.promise;const {h}=await setup([a,doc('b'),doc('fresh-a'),doc('fresh-b')]);h.acceptFile('old',file('replacement.pdf'));await flush();assert.equal(h.S.oldDoc.name,'fresh-a');teardown.resolve();await flush();assert.equal(h.S.oldDoc.name,'fresh-a');
});
test('simultaneous same-key detail requests share one render',async()=>{
 const {h}=await readyAdded(),gate=deferred();let calls=0;h.S.newDoc.getPage=async()=>{calls++;return page(gate)};const first=h.selectPair(0),second=h.selectPair(0);await flush();assert.equal(calls,1);gate.resolve();await Promise.all([first,second]);assert.equal(h.S.detailed.size,1);
});
test('navigating away cancels a pending detail and suppresses its late result',async()=>{
 const {h}=await readyAdded(),gate=deferred(),slow=page(gate);h.S.pairs.push({...h.S.pairs[0],newIndex:2});h.S.newDoc.getPage=async i=>i===1?slow:page();const first=h.selectPair(0);await flush();await h.selectPair(1);assert.equal(slow.cancelCalls,1);gate.resolve();await first;assert.equal(h.S.current,1);assert.equal(h.S.detailed.size,1);assert.ok([...h.S.detailed.keys()][0].startsWith('1:'));
});
test('failed second page render releases the first temporary canvas',async()=>{
 const {h}=await setup([doc('a'),doc('b')]);h.S.detailed.clear();const before=h.canvases.length;h.S.newDoc.getPage=async()=>page({promise:Promise.reject(Error('render failed'))});await h.selectPair(0);assert.equal(h.S.detailed.size,0);assert.ok(h.canvases.slice(before).every(c=>c.width===0&&c.height===0));
});
test('min-region change invalidates pending detail before debounce',async()=>{
 const {h}=await readyAdded(),gate=deferred(),slow=page(gate);h.S.newDoc.getPage=async()=>slow;const pending=h.selectPair(0);await flush();h.$('minRegion').value='20';await h.$('minRegion').fire('input');gate.resolve();await pending;assert.equal(h.S.detailed.size,0);assert.equal(slow.cancelCalls,1);
});
test('CSV and current detail use only the exact active settings key',async()=>{
 const {h}=await readyAdded();const old={diffPercent:.91,shift:{dx:99,dy:99}},current={diffPercent:.12,shift:{dx:1,dy:2}};h.S.detailed.set('0:standard:24:8',old);h.$('quality').value='high';h.S.detailed.set('0:high:24:8',current);assert.equal(h.currentDetail(),current);h.exportCsv();const csv=await h.downloads[0].text();assert.match(csv,/"12.000","1","2"/);assert.doesNotMatch(csv,/91.000/);
});
test('PNG callback cannot export after settings, reset, navigation, or replacement',async()=>{
 for(const change of ['quality','reset','navigation','replacement']){
  const {h}=await setup([doc('a'),doc('b')]);const detail=h.currentDetail();assert.ok(detail?.diffCanvas);let callback;detail.diffCanvas.toBlob=cb=>{callback=cb};await h.saveDiffPng();assert.equal(typeof callback,'function');if(change==='quality'){h.$('quality').value='high';await h.$('quality').fire('change');await flush()}else if(change==='navigation'){h.S.pairs.push({...h.S.pairs[0]});await h.selectPair(1)}else if(change==='replacement'){engine(h,[doc('fresh-a'),doc('fresh-b')]);h.acceptFile('old',file('replacement.pdf'));await flush()}else await h.resetAll();callback(new Blob(['png']));assert.equal(h.downloads.length,0);
 }
});
function passwordSetup(){const h=harness(),gates=[deferred(),deferred()];h.S.oldFile=file('locked-a.pdf');h.S.newFile=file('locked-b.pdf');const tasks=engine(h,gates);const comparing=h.compare();return {h,gates,tasks,comparing};}
test('two password requests are queued and both can finish',async()=>{
 const {h,gates,tasks,comparing}=passwordSetup();await flush();tasks[0].onPassword(()=>gates[0].resolve(doc('a')),1);tasks[1].onPassword(()=>gates[1].resolve(doc('b')),1);await flush();assert.match(h.$('passwordMessage').textContent,/locked-a/);h.$('passwordInput').value='test-a';await h.$('passwordForm').fire('submit',{preventDefault(){}});await flush();assert.match(h.$('passwordMessage').textContent,/locked-b/);h.$('passwordInput').value='test-b';await h.$('passwordForm').fire('submit',{preventDefault(){}});await comparing;assert.equal(h.S.pairs.length,1);assert.equal(h.$('passwordDialog').open,false);
});
test('reset closes the active password and queued prompts never reopen',async()=>{
 const {h,gates,tasks,comparing}=passwordSetup();await flush();let updates=0;tasks[0].onPassword(()=>updates++,1);tasks[1].onPassword(()=>updates++,1);await flush();await h.resetAll();await flush();assert.equal(h.$('passwordDialog').open,false);assert.equal(h.S.password,null);assert.equal(updates,0);assert.deepEqual(tasks.map(t=>t.destroyCalls),[1,1]);gates[0].reject(Error('cancelled'));gates[1].reject(Error('cancelled'));await comparing;assert.equal(h.$('status').textContent,'Choose two PDF files.');
});
test('password cancel destroys both loads and preserves cancellation status',async()=>{
 const {h,gates,tasks,comparing}=passwordSetup();await flush();tasks.forEach((task,i)=>{task.destroy=async()=>{task.destroyCalls++;gates[i].reject(Error('destroyed'))}});tasks[0].onPassword(()=>{},1);await flush();await h.$('passwordCancel').fire('click');await comparing;assert.deepEqual(tasks.map(t=>t.destroyCalls),[1,1]);assert.equal(h.$('passwordDialog').open,false);assert.equal(h.$('status').textContent,'Operation cancelled.');
});

test('latest debounce request recalculates using current settings',async()=>{
 const {h}=await readyAdded();h.$('threshold').value='35';await h.$('threshold').fire('input');h.$('minRegion').value='12';await h.$('minRegion').fire('input');const timer=h.timerCallbacks.at(-1);timer();await flush();assert.equal(h.S.detailed.size,1);assert.ok(h.S.detailed.has('0:standard:35:12'));assert.equal(h.$('stage').querySelector('canvas').width,1050);
});
test('a settings value changed before its input event cannot show a stale cancellation error',async()=>{
 const {h}=await readyAdded(),gate=deferred();let count=0;h.S.newDoc.getPage=async()=>++count===1?page(gate):page();
 const pending=h.selectPair(0);await flush();h.$('threshold').value='39';gate.resolve();await pending;
 assert.equal(h.errors.length,0);assert.doesNotMatch(h.$('stage').innerHTML,/Could not open/);
 await h.$('threshold').fire('input');h.timerCallbacks.at(-1)();await flush();assert.ok(h.S.detailed.has('0:standard:39:8'));
});

function defaults(h){h.$('threshold').value='28';h.$('minRegion').value='3';h.$('quality').value='standard';}
function settingsAreDefault(h){assert.deepEqual(JSON.parse(JSON.stringify(h.detailSettings())),{threshold:28,minRegion:3,quality:'standard'});assert.equal(h.$('thresholdValue').textContent,'28');assert.equal(h.$('regionValue').textContent,'0.03%');}
function assertEmptyView(h){
 assert.deepEqual([...h.visible()],[]);assert.equal(h.S.current,-1);assert.equal(h.currentDetail(),null);assert.equal(h.S.detailed.size,0);assert.equal(h.$('stage').querySelectorAll('canvas').length,0);assert.equal(h.$('stage').hidden,true);assert.equal(h.$('empty').hidden,false);assert.match(h.$('empty').textContent,/No changed pages|変更のあるページはありません/);assert.equal(h.$('viewerMeta').textContent,'');assert.equal(h.$('mobilePage').textContent,'0 / 0');assert.equal(h.$('savePng').disabled,true);
 for(const id of ['prev','next','mobilePrev','mobileNext'])assert.equal(h.$(id).disabled,true);
 for(const id of ['metricVisual','metricText','metricShift','shiftValue'])assert.equal(h.$(id).textContent,'-');
 assert.equal(h.$('regions').children.length,0);assert.equal(h.$('textDiff').innerHTML,'');
}
test('reset comparison settings restores all controls and keeps the comparison and view choices',async()=>{
 const {h,tasks}=await readyAdded();h.S.pairs.push({...h.S.pairs[0],newIndex:2});h.S.current=1;h.S.mode='side';h.S.zoom=2;h.$('changedOnly').checked=true;h.$('quality').value='high';h.$('threshold').value='40';h.$('minRegion').value='20';
 const before={scope:h.S.comparison,files:[h.S.oldFile,h.S.newFile],docs:[h.S.oldDoc,h.S.newDoc],pairs:h.S.pairs,version:h.S.detailVersion};let calls=0;h.S.newDoc.getPage=async()=>{calls++;return page()};
 await h.$('resetSettings').fire('click');await flush();settingsAreDefault(h);assert.equal(h.S.detailVersion,before.version+1);assert.equal(calls,1);assert.equal(h.S.current,1);assert.equal(h.S.mode,'side');assert.equal(h.S.zoom,2);assert.equal(h.$('changedOnly').checked,true);assert.equal(h.S.comparison,before.scope);assert.equal(h.S.pairs,before.pairs);assert.deepEqual([h.S.oldFile,h.S.newFile],before.files);assert.deepEqual([h.S.oldDoc,h.S.newDoc],before.docs);assert.ok(tasks.every(t=>t.destroyCalls===0));assert.equal(h.$('stage').querySelector('canvas').width,1050);
});
for(const [field,value] of [['threshold','40'],['minRegion','20'],['quality','high']])test(`settings reset restores a single changed ${field}`,async()=>{
 const h=harness();defaults(h);h.$(field).value=value;const version=h.S.detailVersion;await h.$('resetSettings').fire('click');settingsAreDefault(h);assert.equal(h.S.detailVersion,version+1);assert.equal(h.S.comparison,null);
});
test('settings reset is a no-op at defaults, including a current pending render',async()=>{
 const {h}=await readyAdded();defaults(h);const gate=deferred(),slow=page(gate);h.S.newDoc.getPage=async()=>slow;const pending=h.selectPair(0);await flush();const version=h.S.detailVersion,request=h.S.viewRequest;
 await h.$('resetSettings').fire('click');await h.$('resetSettings').fire('click');assert.equal(h.S.detailVersion,version);assert.equal(h.S.viewRequest,request);assert.equal(slow.cancelCalls,0);gate.resolve();await pending;assert.equal(h.S.detailed.size,1);
});
test('settings reset retires a pending render once and old range debounce cannot rerender',async()=>{
 const {h}=await readyAdded();const gate=deferred(),slow=page(gate);let calls=0;h.S.newDoc.getPage=async()=>++calls===1?slow:page();
 h.$('threshold').value='40';await h.$('threshold').fire('input');const oldTimer=h.timerCallbacks.at(-1);oldTimer();await flush();const version=h.S.detailVersion;
 await h.$('resetSettings').fire('click');await flush();settingsAreDefault(h);assert.equal(slow.cancelCalls,1);assert.equal(h.S.detailVersion,version+1);oldTimer();gate.resolve();await flush();assert.equal(calls,2);assert.equal(h.S.detailed.size,1);assert.ok(h.S.detailed.has('0:standard:28:3'));assert.equal(h.errors.length,0);
});
test('settings reset during document loading keeps the loading scope alive',async()=>{
 const h=harness(),a=deferred(),b=deferred();h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');const tasks=engine(h,[a,b]);const pending=h.compare();await flush();const scope=h.S.comparison;
 await h.$('resetSettings').fire('click');settingsAreDefault(h);assert.equal(h.S.comparison,scope);assert.ok(tasks.every(t=>t.destroyCalls===0));a.resolve(doc('a'));b.resolve(doc('b'));await pending;assert.ok(h.S.detailed.has('0:standard:28:3'));
});
test('empty Changed-only clears the excluded page and recovers when switched off',async()=>{
 const {h}=await setup([doc('before'),doc('after')]);h.S.blink=9;h.$('changedOnly').checked=true;await h.$('changedOnly').fire('change');await flush();assertEmptyView(h);assert.equal(h.S.blink,null);
 await h.saveDiffPng();assert.equal(h.downloads.length,0);h.exportCsv();assert.match(await h.downloads[0].text(),/"false"/);
 h.$('changedOnly').checked=false;await h.$('changedOnly').fire('change');await flush();assert.equal(h.S.current,0);assert.equal(h.$('stage').querySelectorAll('canvas').length,1);assert.equal(h.$('savePng').disabled,false);
});
test('Changed-only selected before load never selects an unchanged page',async()=>{
 const h=harness();h.$('changedOnly').checked=true;h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');engine(h,[doc('a'),doc('b')]);await h.compare();assertEmptyView(h);
});
test('empty Changed-only stays empty through reset, settings, language, mode and zoom',async()=>{
 const {h}=await setup([doc('before'),doc('after')]);h.$('changedOnly').checked=true;await h.$('changedOnly').fire('change');
 for(const change of [async()=>h.$('resetSettings').fire('click'),async()=>{h.$('threshold').value='40';await h.$('threshold').fire('input');h.timerCallbacks.at(-1)()},async()=>{h.$('quality').value='high';await h.$('quality').fire('change')},async()=>h.$('lang').fire('click'),async()=>{h.S.mode='side';await h.selectPair(h.S.current)},async()=>h.$('zoomIn').fire('click')]){await change();await flush();assertEmptyView(h);}
});
test('filtering a pending detail to empty cancels it and rejects its late result',async()=>{
 const {h}=await setup([doc('before'),doc('after')]);h.S.detailed.clear();const gate=deferred(),slow=page(gate);h.S.oldDoc.getPage=async()=>slow;const pending=h.selectPair(0);await flush();h.$('changedOnly').checked=true;await h.$('changedOnly').fire('change');assert.equal(slow.cancelCalls,1);gate.resolve();await pending;assertEmptyView(h);assert.equal(h.errors.length,0);
});
test('PNG callbacks from an excluded page cannot download after empty-filter recovery',async()=>{
 const {h}=await setup([doc('before'),doc('after')]);let callback;h.currentDetail().diffCanvas.toBlob=cb=>callback=cb;await h.saveDiffPng();h.$('changedOnly').checked=true;await h.$('changedOnly').fire('change');callback(new Blob(['png']));assert.equal(h.downloads.length,0);h.$('changedOnly').checked=false;await h.$('changedOnly').fire('change');await flush();callback(new Blob(['png']));assert.equal(h.downloads.length,0);
});
test('filtered selection and navigation only use added, deleted or changed pairs',async()=>{
 const {h}=await readyAdded();h.S.pairs.push({...h.S.pairs[0],status:'deleted',oldIndex:1,newIndex:null},{...h.S.pairs[0],status:'matched',oldIndex:1,textSimilarity:1,newIndex:1},{...h.S.pairs[0],changed:false,newIndex:4});h.$('changedOnly').checked=true;
 await h.selectPair(3);assert.equal(h.S.current,0);h.navigate(99);await flush();assert.equal(h.S.current,2);h.navigate(99);await flush();assert.equal(h.S.current,2);h.navigate(-99);await flush();assert.equal(h.S.current,0);
});
for(const dialog of ['helpDialog','resetDialog','passwordDialog'])test(`${dialog} keeps comparison keyboard shortcuts inactive`,async()=>{
 const h=harness();h.S.pairs=[{changed:true},{changed:true}];h.$(dialog).open=true;h.context.document.activeElement=h.$(dialog);let prevented=0;
 for(const key of ['ArrowLeft','ArrowRight','+','=','-','0'])await h.fireDocument('keydown',{key,preventDefault(){prevented++}});
 assert.equal(h.S.current,0);assert.equal(h.S.zoom,1);assert.equal(prevented,0);
});
test('editing, composition, modifiers and prevented keys retain native keyboard behavior',async()=>{
 const h=harness();h.S.pairs=[{changed:true},{changed:true}];let prevented=0;
 const guards=[{target:{tagName:'INPUT'}},{target:{tagName:'SELECT'}},{target:{tagName:'TEXTAREA'}},{target:{tagName:'SPAN',isContentEditable:true}},{isComposing:true},{keyCode:229},{ctrlKey:true},{altKey:true},{metaKey:true},{defaultPrevented:true}];
 for(const guard of guards){h.context.document.activeElement=guard.target||{tagName:'BODY'};for(const key of ['ArrowRight','+'])await h.fireDocument('keydown',{key,preventDefault(){prevented++},...guard});}
 assert.equal(h.S.current,0);assert.equal(h.S.zoom,1);assert.equal(prevented,0);
});
test('unmodified comparison shortcuts work after Help closes and prevent only handled defaults',async()=>{
 const {h}=await readyAdded();h.S.pairs.push({...h.S.pairs[0],newIndex:2});h.$('helpDialog').open=false;h.context.document.activeElement={tagName:'BUTTON'};let prevented=0;
 for(const key of ['ArrowRight','+']){await h.fireDocument('keydown',{key,preventDefault(){prevented++}});await flush();}assert.equal(h.S.current,1);assert.equal(h.S.zoom,1.25);assert.equal(prevented,2);
 await h.fireDocument('keydown',{key:'a',preventDefault(){prevented++}});assert.equal(prevented,2);
});

test('settings reset label and tooltip switch languages and match the real markup defaults',async()=>{
 const h=harness();assert.match(html,/id="threshold"[^>]*value="28"/);assert.match(html,/id="minRegion"[^>]*value="3"/);assert.equal(h.$('resetSettings').textContent,'Reset comparison settings');assert.match(h.$('resetSettings').title,/28.*0.03%.*Standard/);await h.$('lang').fire('click');assert.equal(h.$('resetSettings').textContent,'比較設定を初期値へ');assert.match(h.$('resetSettings').title,/28.*0.03%.*標準/);
});
test('reset at defaults retains cached detail and a valid pending default-settings debounce',async()=>{
 const {h}=await readyAdded();defaults(h);await h.selectPair(0);const detail=h.currentDetail(),version=h.S.detailVersion,request=h.S.viewRequest;
 await h.$('resetSettings').fire('click');assert.equal(h.currentDetail(),detail);assert.equal(h.S.detailVersion,version);assert.equal(h.S.viewRequest,request);
 await h.$('threshold').fire('input');const timer=h.timerCallbacks.at(-1),pendingVersion=h.S.detailVersion;await h.$('resetSettings').fire('click');assert.equal(h.S.detailVersion,pendingVersion);timer();await flush();assert.ok(h.S.detailed.has('0:standard:28:3'));
});
test('PNG waiting for detail is cancelled when its current page becomes excluded',async()=>{
 const {h}=await setup([doc('before'),doc('after')]);h.S.detailed.clear();const gate=deferred(),slow=page(gate);h.S.oldDoc.getPage=async()=>slow;const pending=h.saveDiffPng();await flush();h.$('changedOnly').checked=true;await h.$('changedOnly').fire('change');gate.resolve();await pending;assertEmptyView(h);assert.equal(h.downloads.length,0);assert.equal(h.errors.length,0);
});
test('empty filter selects a valid newly available pair and handles filtered keyboard navigation',async()=>{
 const {h}=await setup([doc('before'),doc('after')]);h.$('changedOnly').checked=true;await h.$('changedOnly').fire('change');h.S.pairs.push({status:'added',newIndex:1,changed:true,quickDiff:1,textSimilarity:0});await h.$('changedOnly').fire('change');await flush();assert.equal(h.S.current,1);assert.deepEqual([...h.visible()],[1]);assert.equal(h.$('stage').hidden,false);assert.equal(h.$('empty').hidden,true);h.navigate(-1);await flush();assert.equal(h.S.current,1);
});

const completionStatus={en:'Comparison is ready. Detailed differences are calculated when you open a page.',ja:'比較の準備ができました。ページを選ぶと詳細差分を計算します。'};
for(const language of ['en','ja'])test(`completion status follows ${language} language switches without reloading or losing results`,async()=>{
 const h=harness(language);h.S.oldFile=file('before.pdf');h.S.newFile=file('after.pdf');const tasks=engine(h,[doc('before'),doc('after')]);await h.compare();
 const before={scope:h.S.comparison,pairs:h.S.pairs,old:h.S.oldDoc,new:h.S.newDoc,detail:h.currentDetail(),version:h.S.detailVersion,current:h.S.current};
 h.S.mode='side';h.S.zoom=2;let pageCalls=0;h.S.oldDoc.getPage=h.S.newDoc.getPage=async()=>{pageCalls++;return page()};
 for(const expected of [language==='en'?'ja':'en',language]){
  await h.$('lang').fire('click');await flush();assert.equal(h.$('status').textContent,completionStatus[expected]);assert.equal(h.$('status').classList.contains('error'),false);
  assert.equal(h.S.comparison,before.scope);assert.equal(h.S.pairs,before.pairs);assert.equal(h.S.oldDoc,before.old);assert.equal(h.S.newDoc,before.new);assert.equal(h.currentDetail(),before.detail);assert.equal(h.S.detailVersion,before.version);assert.equal(h.S.current,before.current);assert.equal(h.S.mode,'side');assert.equal(h.S.zoom,2);assert.equal(pageCalls,0);assert.equal(tasks.length,2);assert.ok(tasks.every(task=>task.destroyCalls===0));
 }
 h.exportCsv();assert.match(await h.downloads[0].text(),/"1","1","1","matched"/);
});
test('loading status changes language without touching progress or pending document tasks',async()=>{
 const h=harness(),a=deferred(),b=deferred();h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');const tasks=engine(h,[a,b]);const pending=h.compare();await flush();const scope=h.S.comparison;
 await h.$('lang').fire('click');assert.equal(h.$('status').textContent,'PDFを読み込んでいます…');assert.equal(h.$('progressBar').style.width,'2%');assert.equal(h.$('progress').classList.contains('show'),true);assert.equal(h.S.comparison,scope);assert.ok(tasks.every(task=>task.destroyCalls===0));
 a.resolve(doc('a'));b.resolve(doc('b'));await pending;assert.equal(h.$('status').textContent,completionStatus.ja);
});
for(const side of ['before','after'])test(`analysis status retranslates ${side} page label and keeps its page count`,async()=>{
 const h=harness(),gate=deferred(),slow=doc(side);slow.numPages=2;slow.getPage=async n=>n===2?gate.promise:page();h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');engine(h,side==='before'?[slow,doc('after')]:[doc('before'),slow]);const pending=h.compare();await flush();
 assert.equal(h.$('status').textContent,`Analyzing pages… ${side==='before'?'Before':'After'} 1/2`);const width=h.$('progressBar').style.width;
 await h.$('lang').fire('click');assert.equal(h.$('status').textContent,`ページを解析しています… ${side==='before'?'変更前':'変更後'} 1/2`);assert.equal(h.$('progressBar').style.width,width);
 await h.$('lang').fire('click');assert.equal(h.$('status').textContent,`Analyzing pages… ${side==='before'?'Before':'After'} 1/2`);gate.resolve(page());await pending;assert.equal(h.$('status').textContent,completionStatus.en);
});
test('failed load status retranslates its prefix and retains error details and styling',async()=>{
 const h=harness(),failure=deferred();h.S.oldFile=file('valid.pdf');h.S.newFile=file('invalid.pdf');engine(h,[doc('valid'),failure]);const pending=h.compare();await flush();failure.reject(Error('synthetic invalid PDF'));await pending;
 await h.$('lang').fire('click');assert.equal(h.$('status').textContent,'PDFを開けませんでした。 synthetic invalid PDF');assert.equal(h.$('status').classList.contains('error'),true);assert.equal(h.$('progress').classList.contains('show'),false);
 await h.$('lang').fire('click');assert.equal(h.$('status').textContent,'Could not open the PDF. synthetic invalid PDF');
 await h.resetAll();await h.$('lang').fire('click');assert.equal(h.$('status').textContent,'2つのPDFを選択してください。');assert.equal(h.$('status').classList.contains('error'),false);
});
test('invalid input status remains an error after language switch even with completed results',async()=>{
 const {h}=await setup([doc('a'),doc('b')]);const pairs=h.S.pairs,scope=h.S.comparison;h.acceptFile('old',{name:'bad.txt',type:'text/plain'});
 await h.$('lang').fire('click');await flush();assert.equal(h.$('status').textContent,'PDFファイルを選択してください。');assert.equal(h.$('status').classList.contains('error'),true);assert.equal(h.S.pairs,pairs);assert.equal(h.S.comparison,scope);
});
test('cancellation status retranslates without reviving disposed loads',async()=>{
 const {h,gates,tasks,comparing}=passwordSetup();await flush();tasks.forEach((task,i)=>{task.destroy=async()=>{task.destroyCalls++;gates[i].reject(Error('destroyed'))}});tasks[0].onPassword(()=>{},1);await flush();await h.$('passwordCancel').fire('click');await comparing;
 await h.$('lang').fire('click');assert.equal(h.$('status').textContent,'処理をキャンセルしました。');assert.equal(h.$('status').classList.contains('error'),false);assert.deepEqual(tasks.map(task=>task.destroyCalls),[1,1]);assert.equal(h.$('passwordDialog').open,false);
});
test('language switches after reset cannot restore status from an obsolete comparison',async()=>{
 const h=harness(),a=deferred(),b=deferred();h.S.oldFile=file('a.pdf');h.S.newFile=file('b.pdf');engine(h,[a,b]);const pending=h.compare();await flush();await h.resetAll();await h.$('lang').fire('click');assert.equal(h.$('status').textContent,'2つのPDFを選択してください。');a.reject(Error('obsolete failure'));b.resolve(doc('late'));await pending;
 await h.$('lang').fire('click');assert.equal(h.$('status').textContent,'Choose two PDF files.');assert.equal(h.$('status').classList.contains('error'),false);assert.equal(h.S.pairs.length,0);assert.equal(h.errors.length,0);
});
