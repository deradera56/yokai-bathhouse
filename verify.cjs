const assert = require('node:assert/strict');
const B = require('./dist/rules.js');
function solve(n, target=n[5], {limit=n[4],ban}={}) {
  let layer=[{s:B.start(n),path:[]}];
  for(let t=0;t<limit;t++){
    const next=new Map();
    for(const {s,path} of layer) for(const a of B.actions(s,n)){
      if(a[0]===ban)continue;
      const z=B.step(s,n,a), route=[...path,a];
      if(z.served>=target)return route;
      if(z.lost>n[2].length-target||B.done(z,n))continue;
      const key=JSON.stringify(z);
      if(!next.has(key)) next.set(key,{s:z,path:route});
    }
    const rank=({s})=>s.served*12-s.queue.length*4+s.baths.flatMap(b=>b.people.map(p=>2*p.streak+Number(B.happy(p,b,n)))).reduce((a,b)=>a+b,0);
    layer=[...next.values()].sort((a,b)=>rank(b)-rank(a)).slice(0,2200);
  }
}
if(require.main===module){
for(const [i,n] of B.nights.entries()){
  const [limit,ban]=B.specials[i];
  const route=solve(n,n[5],{limit:limit??n[4],ban});
  assert.ok(route,'No challenge path: '+n[1]);
  const s=route.reduce((z,a)=>B.step(z,n,a),B.start(n));
  assert.ok(B.awards(s,n,i)&2,n[1]);
  console.log('Stamp '+(i+1)+': '+s.turn+' turns');
}
for(const n of B.nights){
  const route=solve(n,n[2].length);
  assert.ok(route,'No verified path: '+n[0]);
  let s=B.start(n);
  for(const a of route){
    const old=JSON.stringify(s), next=B.step(s,n,a);
    assert.equal(JSON.stringify(s),old);
    assert.equal(next.turn,s.turn+1);
    assert.equal(next.served+next.lost+next.queue.length+next.baths.flatMap(b=>b.people).length,n[2].length);
    s=next;
  }
  console.log(n[1]+': '+s.served+'/'+n[2].length+' in '+s.turn+' turns');
}
const n=B.nights[0], s=B.start(n);
assert.equal(B.step(s,n,['move',99,0,0]),s);
const seated=B.step(s,n,['seat',0]);
assert.equal(B.temp(seated.baths[0]),-1);
assert.equal(seated.baths[0].people[0].streak,1);
assert.equal(B.step(seated,n,['wait']).served,1);
assert.equal(B.step(s,n,[['seat'],0]),s);
const dry=B.nights[2];
let q=B.step(B.step(B.start(dry),dry,['seat',0]),dry,['seat',1]);
assert.equal(q.queue[0].age,0);
for(let i=0;i<2;i++)q=B.step(q,dry,['wait']);
assert.equal(q.queue[0].age,2);
assert.equal(B.step(q,dry,['wait']).lost,1);
assert.equal(B.hint(B.step(q,dry,['wait']),dry).status,'blocked');
const waves=B.nights[9];
let w=B.step(B.start(waves),waves,['heat',0,-1]);
while(w.served<waves[5]){
  const h=B.hint(w,waves);
  assert.equal(h.status,'move','Hint should recover after cooling Bath 1 on Night 10');
  const next=B.step(w,waves,h.action);
  assert.notEqual(next,w);
  w=next;
}
const gate=B.nights[12], g=B.start(gate);
assert.ok(!B.actions(g,gate).some(a=>a[0]==='heat'));
assert.deepEqual(B.step(g,gate,['gate',0]).baths.map(b=>b.base),[0,0]);
assert.equal(B.step(g,gate,['gate',1]),g);
assert.equal(solve(gate,gate[5],{ban:'gate'}),undefined,'The valve tutorial must need a valve');
const pair=B.nights[14];
let p=B.step(B.start(pair),pair,['seat',0]);
assert.equal(p.baths[0].people[0].streak,0);
p=B.step(p,pair,['seat',1]);
assert.equal(p.baths[0].people[0].streak,0);
const echo=B.nights[16];
let e=B.step(B.step(B.start(echo),echo,['seat',0]),echo,['wait']);
assert.equal(e.baths[0].echo,1);
assert.equal(B.temp(e.baths[0]),1);
assert.equal(B.step(e,echo,['wait']).baths[0].echo,0);
}
module.exports=solve;
