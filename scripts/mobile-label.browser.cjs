'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const evidence = path.resolve('test-results/mobile-label');
async function main() {
  fs.mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const language of ['ja', 'en']) for (const [width, height] of [[1360,900],[320,568],[360,640],[390,844],[393,252]]) {
      const context = await browser.newContext({ viewport: {width,height}, locale: language, reducedMotion:'reduce' });
      const page = await context.newPage();
      const errors=[], requests=[];
      const label=`${language}-${width}x${height}`;
      page.on('pageerror', e=>errors.push(e.message));
      page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
      page.on('request', r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
      try {
        await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);
        await page.locator('#lang').waitFor();
        if(await page.locator('html').getAttribute('lang')!==language)await page.locator('#lang').click();
 assert.equal(await page.locator('#help svg path').last().evaluate(el=>getComputedStyle(el).strokeLinecap),'round',label+': Help dot has round caps');
 const headerVersion=page.locator('header #version');
 assert.equal(await headerVersion.isVisible(),true,label+': header version is visible');
 assert.equal((await headerVersion.textContent()).trim(),'v'+JSON.parse(fs.readFileSync(path.resolve(__dirname,'../app.config.json'),'utf8')).version,label+': current version');
 assert.ok(await headerVersion.evaluate(el=>{const r=el.getBoundingClientRect();if(r.left<0||r.right>innerWidth||el.scrollWidth>el.clientWidth+1)return false;for(let p=el.parentElement;p;p=p.parentElement){if(/hidden|clip/.test(getComputedStyle(p).overflowX)){const b=p.getBoundingClientRect();if(r.left<b.left-1||r.right>b.right+1)return false;}}return true;}),label+': version is not clipped');
 assert.equal(await page.locator('.local svg path').first().getAttribute('d'),'M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z',label+': shared privacy shield');
        const badge=page.locator('[data-i18n="localOnly"]');
        assert.equal(await badge.innerText(),language==='ja'?'完全ローカル処理':'Fully local processing');
        assert.equal(await badge.isVisible(), width > 760, label+': preserve existing mobile badge hiding');
        if(width > 760) assert.ok(await badge.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+1;}), label+': badge not clipped');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': page width');
        assert.equal(await page.locator('footer').count(),0,'No informational footer is added.');
        if(width!==393) await page.screenshot({path:path.join(evidence,label+'.png')});
        await page.locator('#help').click();
        const body=page.locator('#helpDialog .dialog-body');
        await body.evaluate(el=>{el.scrollTop=el.scrollHeight;});
        const helpEnd = await page.locator('#buildInfo').evaluate(el=>{const r=el.getBoundingClientRect(),body=el.parentElement.getBoundingClientRect(),dialog=el.closest('dialog').getBoundingClientRect();return {top:r.top,bottom:r.bottom,clipTop:Math.max(0,body.top,dialog.top),clipBottom:Math.min(innerHeight,body.bottom,dialog.bottom)};});
        assert.ok(helpEnd.top>=helpEnd.clipTop-1&&helpEnd.bottom<=helpEnd.clipBottom+1,label+': final Help guidance reachable '+JSON.stringify(helpEnd));
        assert.notEqual(await page.locator('#buildInfo').innerText(), '-');
        assert.equal(await page.locator('#helpDialog .dialog-body > :last-child').getAttribute('id'),'buildInfo');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#helpDialog').isVisible(),false);
        assert.deepEqual(errors,[],label+': runtime errors');
        assert.deepEqual(requests,[],label+': external requests');
        console.log('PASS '+label);
      } catch(error) {
        await page.screenshot({path:path.join(evidence,'failure-'+label+'.png')}).catch(()=>{});
        throw error;
      } finally {await context.close();}
    }
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
