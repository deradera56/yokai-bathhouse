const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require(process.env.BATHHOUSE_PLAYWRIGHT||'playwright');
const {nights}=require('./dist/rules.js');
const solve=require('./verify.cjs');

(async()=>{
 const browser=await chromium.launch({channel:process.env.BATHHOUSE_BROWSER||'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:1050,height:740},offline:!process.env.BATHHOUSE_URL});
 context.setDefaultTimeout(6000);
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const url=process.env.BATHHOUSE_URL||pathToFileURL(path.join(process.env.BATHHOUSE_DIST||path.join(__dirname,'dist'),'index.html')).href;
 await page.goto(url);
 const stale=await context.newPage();
 await stale.goto(url);
 const click=async selector=>{
   const button=await page.locator(selector).first().elementHandle();
   await button.click();
   await page.waitForFunction(el=>!el.isConnected,button);
   await button.dispose();
 };
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
 await click('[data-nav="undo"]');
 assert.match(await page.locator('.stats').innerText(),/残り 6/);
 assert.equal(await page.locator('[data-nav="undo"]').isDisabled(),true);
 for(const a of route)await act(a);
 await click('[data-nav="undo"]');
 assert.equal(await page.locator('.result').count(),0);
 await act(route.at(-1));
 assert.equal(await page.locator('.stamp-result .collected').count(),2);
 await stale.locator('[data-nav=language]').click();
 await page.reload();
 assert.equal(await page.locator('html').getAttribute('lang'),'en');
 assert.match(await page.locator('.stamp-album summary').innerText(),/2\/36/);
 assert.equal(await page.locator('.levels [data-level="12"]').isDisabled(),true);
 assert.equal(await page.locator('.levels [data-level="1"]').isEnabled(),true);
 await stale.locator('.hero .primary').click();
 await stale.locator('[data-action="seat,0"]').click();
 await stale.locator('#bath-0 .is-happy').waitFor();
 await stale.reload();
 await stale.locator('[data-nav="resume"]').click();
 await stale.locator('#bath-0 .is-happy').waitFor();
 for(const a of route.slice(1))await stale.locator('[data-action="'+a.join(',')+'"]').click();
 await stale.locator('.result').waitFor();
 await page.reload();
 console.log('Night 1 and reload checks passed');
 for(let i=1;i<nights.length;i++){
   await click('[data-level="'+i+'"]');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at night '+i);
   if(i===12)assert.equal(await page.getByRole('button',{name:'Valve: heat Bath 1, cool Bath 2'}).count(),1);
   if(i===2){
     await click('[data-nav="hint"]');
     assert.match(await page.locator('.hint-card').innerText(),/Kappa leaves/);
     await click('[data-nav="hint-move"]');
     assert.match(await page.locator('.hint-card').innerText(),/Seat Tengu in Bath/);
     assert.match(await page.locator('.overview').innerText(),/Next:\s+Tengu/);
     await click('[data-nav="hint"]');
     await act(['seat',0]);
     await act(['seat',0]);
     for(let j=0;j<3;j++)await act(['wait']);
     assert.match(await page.locator('.overview-note').innerText(),/goal is now out of reach/i);
     await click('[data-nav="undo"]');
     assert.match(await page.locator('.deadline').innerText(),/Leaves in 1 turns/);
     assert.match(await page.locator('.stats').innerText(),/Walked out 0/);
     page.once('dialog',d=>d.accept());
     await click('[data-nav="retry"]');
   }
   if(i===16){
     await act(['seat',0]);
     await act(['wait']);
     assert.match(await page.locator('#bath-0 small').innerText(),/Lingering heat \+1/);
     await click('[data-nav="menu"]');
     await page.reload();
     await click('[data-nav="resume"]');
     assert.match(await page.locator('#bath-0 small').innerText(),/Lingering heat \+1/);
     await click('[data-nav="undo"]');
     assert.equal(await page.locator('#bath-0 .people li').count(),1);
     assert.match(await page.locator('#bath-0 .people').innerText(),/Fire Cat/);
     assert.doesNotMatch(await page.locator('#bath-0 small').innerText(),/Lingering heat/);
     page.once('dialog',d=>d.accept());
     await click('[data-nav="retry"]');
   }
   const commands=(i===4?solve(nights[i],nights[i][5],{limit:8}):solve(nights[i],nights[i][2].length)).map(a=>a.join(','));
   await page.evaluate(async list=>{
     for(const command of list){
       const button=document.querySelector('[data-action="'+command+'"]');
       if(!button||button.disabled)throw new Error('Missing action '+command);
       const painted=new Promise(resolve=>{
         const observer=new MutationObserver(()=>{if(!button.isConnected){observer.disconnect();clearTimeout(timer);resolve()}});
         const timer=setTimeout(()=>{observer.disconnect();resolve()},2500);
         observer.observe(document.querySelector('#app'),{childList:true});
       });
       button.click();
       await painted;
       if(button.isConnected)throw new Error('Action did not update: '+command);
     }
   },commands);
   if(i===4){
     await click('[data-nav="close"]');
     assert.equal(await page.locator('.stamp-result .collected').count(),1);
   }
   assert.equal(await page.locator('.result').count(),1);
   if(i===11)assert.match(await page.locator('.result [data-level="12"]').innerText(),/Open After Hours/);
   console.log('Night '+(i+1)+' passed');
 }
 assert.match(await page.locator('.result h1').innerText(),/milk-bottle toast/i);
 assert.equal(await page.locator('.toast-art svg').count(),3);
 await page.evaluate(()=>{
   const k='yokai-bathhouse-v1', d=JSON.parse(localStorage.getItem(k));
   d.shift={index:0,s:{baths:[]}};localStorage.setItem(k,JSON.stringify(d));
 });
 await page.reload();
 assert.equal(await page.locator('[data-nav=resume]').count(),0);
 assert.equal(await page.locator('[data-level="11"]').isEnabled(),true);
 await click('.levels [data-level="0"]');
 await act(['seat',0]);
 await act(['seat',1]);
 await act(['seat',1]);
 assert.equal(await page.locator('#bath-1 .is-worried').count(),1);
 assert.match(await page.locator('#bath-1 .people').innerText(),/0\/2 · Comfy next turn/);
 assert.match(await page.locator('.overview-note').innerText(),/Happy guests served: 1/);
 await click('[data-nav="menu"]');
 page.once('dialog',d=>d.accept());
 await click('.levels [data-level="1"]');
 await act(['seat',0]);
 assert.match(await page.locator('#bath-0 .people').innerText(),/Needs company/);
 await act(['heat',1,1]);
 assert.equal(await page.evaluate(()=>document.activeElement.closest('.bath')?.id),'bath-1');
 assert.deepEqual(errors,[]);
 console.log('Desktop: all 18 nights, After Hours unlock, ending, save/reload, stale tab, language, focus, corrupt save OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
