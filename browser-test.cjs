const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require(process.env.BATHHOUSE_PLAYWRIGHT||'playwright');
const {nights}=require('./dist/rules.js');
const solve=require('./verify.cjs');

(async()=>{
 const browser=await chromium.launch({channel:process.env.BATHHOUSE_BROWSER||'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:320,height:740},offline:true});
 context.setDefaultTimeout(6000);
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const url=pathToFileURL(path.join(__dirname,'dist/index.html')).href;
 await page.goto(url);
 const stale=await context.newPage();
 await stale.goto(url);
 const click=(selector)=>page.locator(selector).first().click();
 const act=a=>click('[data-action="'+a.join(',')+'"]');
 await click('.hero .primary');
 assert.equal(await page.locator('.reception .is-calm').count(),1);
 assert.equal(await page.evaluate(()=>document.activeElement.tagName),'H2');
 const route=solve(nights[0],3);
 await act(route[0]);
 assert.equal(await page.locator('#bath-0.cold .bathers .is-happy').count(),1);
 assert.equal(await page.locator('#bath-0 .vapor').count(),0);
 await click('[data-nav=menu]');
 await page.reload();
 await click('[data-nav=resume]');
 assert.match(await page.locator('.stats').innerText(),/残り 5/);
 for(const a of route.slice(1))await act(a);
 await stale.locator('[data-nav=language]').click();
 await page.reload();
 assert.equal(await page.locator('html').getAttribute('lang'),'en');
 assert.equal(await page.locator('.levels [data-level="1"]').isEnabled(),true);
 console.log('Night 1 and reload checks passed');
 for(let i=1;i<nights.length;i++){
   await click('[data-level="'+i+'"]');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at night '+i);
   if(i===2){
     await click('[data-nav="hint"]');
     assert.match(await page.locator('.hint-card').innerText(),/Kappa leaves/);
     await click('[data-nav="hint-move"]');
     assert.match(await page.locator('.hint-card').innerText(),/Seat Tengu in Bath/);
     assert.match(await page.locator('.overview').innerText(),/Next:\s+Tengu/);
     await click('[data-nav="hint"]');
   }
   const commands=solve(nights[i],nights[i][2].length).map(a=>a.join(','));
   await page.evaluate(list=>{
     for(const command of list){
       const button=document.querySelector('[data-action="'+command+'"]');
       if(!button||button.disabled)throw new Error('Missing action '+command);
       button.click();
     }
   },commands);
   assert.equal(await page.locator('.result').count(),1);
   console.log('Night '+(i+1)+' passed');
 }
 assert.match(await page.locator('.result h1').innerText(),/last lantern/i);
 await page.evaluate(()=>{
   const k='yokai-bathhouse-v1', d=JSON.parse(localStorage.getItem(k));
   d.shift={index:0,s:{baths:[]}};localStorage.setItem(k,JSON.stringify(d));
 });
 await page.reload();
 assert.equal(await page.locator('[data-nav=resume]').count(),0);
 assert.equal(await page.locator('[data-level="11"]').isEnabled(),true);
 assert.deepEqual(errors,[]);
 console.log('Edge, offline file URL, 320px: all 12 nights, ending, save/reload, stale tab, language, focus, corrupt save OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
