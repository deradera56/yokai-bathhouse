const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require(process.env.BATHHOUSE_PLAYWRIGHT||'playwright');
const {nights}=require('./dist/rules.js');

(async()=>{
 const browser=await chromium.launch({channel:process.env.BATHHOUSE_BROWSER||'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:320,height:568},reducedMotion:'reduce',hasTouch:true});
 page.setDefaultTimeout(7000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.BATHHOUSE_URL||pathToFileURL(path.join(process.env.BATHHOUSE_DIST||path.join(__dirname,'dist'),'index.html')).href;
 await page.goto(url);
 await page.evaluate(best=>localStorage.setItem('yokai-bathhouse-v1',JSON.stringify({best})),nights.map(n=>n[5]));
 await page.reload();
 async function click(selector){
   const button=await page.locator(selector).first().elementHandle();
   if(selector.startsWith('[data-companion='))await button.tap();
   else await button.click();
   await page.waitForFunction(el=>!el.isConnected,button,{polling:100});
   await button.dispose();
 }
 async function fit(){
   assert.deepEqual(await page.evaluate(()=>[document.documentElement.scrollWidth<=innerWidth,document.documentElement.scrollHeight<=innerHeight]),[true,true]);
 }
 await page.setViewportSize({width:320,height:481});
 await click('.levels [data-level="0"]');
 await fit();
 await click('[data-nav="menu"]');
 page.once('dialog',d=>d.accept());
 await page.setViewportSize({width:320,height:568});
 await click('.levels [data-level="2"]');
 await fit();
 await page.locator('[data-companion="1"]').waitFor();
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-companion="1"]').waitFor();
 await click('[data-companion="1"]');
 assert.equal(await page.locator('[data-bath="1"]').getAttribute('aria-pressed'),'true');
 assert.match(await page.locator('.compact-overview').innerText(),/残り 8/);
 await page.locator('[data-companion="0"]').waitFor();
 await click('[data-companion="0"]');
 await page.setViewportSize({width:320,height:568});
 await click('[data-action="seat,0"]');
 await click('[data-action="seat,0"]');
 assert.match(await page.locator('.deadline').innerText(),/あと3手/);
 await click('[data-bath="1"]');
 assert.equal(await page.getByRole('button',{name:'湯船2へ案内：河童'}).count(),1);
 assert.match(await page.locator('[data-companion="0"]').getAttribute('aria-label'),/天狗・火車/);
 await click('[data-action="seat,1"]');
 assert.match(await page.locator('.compact-note').innerText(),/湯船1.*火車/);
 await page.setViewportSize({width:320,height:350});
 await fit();
 assert.equal(await page.locator('[data-companion="0"]').isVisible(),false);
 await click('[data-nav="undo"]');
 assert.ok(await page.evaluate(()=>document.activeElement.getBoundingClientRect().top>=0));
 assert.match(await page.locator('.deadline').innerText(),/あと3手/);
 for(const [width,height] of [[375,667],[390,844],[320,568]]){
   await page.setViewportSize({width,height});
   await fit();
 }
 await click('[data-sheet="hint"]');
 await click('[data-nav="hint-move"]');
 assert.match(await page.locator('.play-sheet[open] p').innerText(),/河童/);
 assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-hint-answer')),true);
 await page.keyboard.press('Escape');
 await page.locator('.play-sheet').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>document.activeElement.dataset.sheet),'hint');
 await click('[data-nav="menu"]');
 page.once('dialog',d=>d.accept());
 await click('.levels [data-level="12"]');
 await click('[data-sheet="adjust"]');
 assert.match(await page.locator('.sheet-action small').innerText(),/湯船1.*適温.*湯船2.*適温/);
 await click('[data-action="gate,0"]');
 assert.equal(await page.locator('.play-sheet').count(),0);
 assert.match(await page.locator('.compact-tabs').innerText(),/適温/);
 await fit();
 await page.setViewportSize({width:568,height:320});
 await fit();
 assert.ok(await page.locator('.compact-primary').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
 await click('[data-sheet="adjust"]');
 await page.setViewportSize({width:1024,height:390});
 await page.locator('.overview').waitFor();
 assert.match(await page.locator('.stats').innerText(),/残り 7/);
 await page.setViewportSize({width:320,height:568});
 await page.locator('.compact-board').waitFor();
 await fit();
 await click('[data-sheet="about"]');
 await click('[data-nav="language"]');
 assert.equal(await page.locator('html').getAttribute('lang'),'en');
 await click('.sheet-back');
 await fit();
 await page.setViewportSize({width:390,height:844});
 await click('[data-nav="menu"]');
 page.once('dialog',d=>d.accept());
 await click('.levels [data-level="11"]');
 assert.equal(await page.locator('.companion-select:visible').count(),2);
 await click('[data-companion="2"]');
 assert.equal(await page.locator('[data-bath="2"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('.companion-select:visible').count(),2);
 await fit();
 for(const [width,height,font] of [[256,580,'100%'],[320,627,'125%'],[320,718,'150%']]){
   await page.setViewportSize({width,height});
   await page.evaluate(v=>document.documentElement.style.fontSize=v,font);
   await page.waitForFunction(()=>{
     const controls=document.querySelector('.compact-bottom').getBoundingClientRect();
     return [...document.querySelectorAll('.companion-select')].filter(el=>getComputedStyle(el).visibility==='visible')
       .every(el=>el.getBoundingClientRect().bottom<=controls.top);
   });
 }
 const seat=page.locator('[data-action="seat,2"]');
 await seat.scrollIntoViewIfNeeded();
 const rect=await seat.boundingBox();
 await page.touchscreen.tap(rect.x+rect.width/2,rect.y+2);
 await page.waitForFunction(()=>document.querySelector('.compact-overview').textContent.includes('Left 11'));
 await page.setViewportSize({width:320,height:844});
 await page.waitForFunction(()=>document.querySelector('.companion-space').dataset.fit==='true');
 assert.equal(await page.locator('.companion-select:visible').count(),2);
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 await page.setViewportSize({width:390,height:844});
 await click('[data-nav="menu"]');
 page.once('dialog',d=>d.accept());
 await click('.levels [data-level="6"]');
 assert.equal(await page.locator('.companion-space').count(),0);
 await fit();
 assert.deepEqual(errors,[]);
 console.log('Mobile: 1–3 baths, companion switching, narrow and enlarged-text hit targets, board fit, deadline, undo, departures, hints, valve, rotation and English OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
