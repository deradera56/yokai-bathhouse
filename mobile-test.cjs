const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require(process.env.BATHHOUSE_PLAYWRIGHT||'playwright');
const {nights}=require('./dist/rules.js');

(async()=>{
 const browser=await chromium.launch({channel:process.env.BATHHOUSE_BROWSER||'msedge'});
 try{
 const page=await browser.newPage({viewport:{width:320,height:568},reducedMotion:'reduce'});
 page.setDefaultTimeout(7000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.BATHHOUSE_URL||pathToFileURL(path.join(process.env.BATHHOUSE_DIST||path.join(__dirname,'dist'),'index.html')).href;
 await page.goto(url);
 await page.evaluate(best=>localStorage.setItem('yokai-bathhouse-v1',JSON.stringify({best})),nights.map(n=>n[5]));
 await page.reload();
 async function click(selector){
   const button=await page.locator(selector).first().elementHandle();
   await button.click();
   await page.waitForFunction(el=>!el.isConnected,button,{polling:100});
   await button.dispose();
 }
 async function fit(){
   assert.deepEqual(await page.evaluate(()=>[document.documentElement.scrollWidth<=innerWidth,document.documentElement.scrollHeight<=innerHeight]),[true,true]);
 }
 await click('.levels [data-level="2"]');
 await fit();
 await click('[data-action="seat,0"]');
 await click('[data-action="seat,0"]');
 assert.match(await page.locator('.deadline').innerText(),/あと3手/);
 await click('[data-bath="1"]');
 assert.equal(await page.getByRole('button',{name:'湯船2へ案内：河童'}).count(),1);
 await click('[data-action="seat,1"]');
 assert.match(await page.locator('.compact-note').innerText(),/湯船1.*火車/);
 await page.setViewportSize({width:320,height:350});
 await fit();
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
 assert.deepEqual(errors,[]);
 console.log('Mobile: 320×350, 320×568, 375×667, 390×844, 568×320; board fit, Kappa deadline, undo, departures, hint dialog, valve forecast, rotation, English OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
