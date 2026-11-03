/* Pure turn engine: usable in a browser or Node. */
const Bath = (() => {
  const guests = {
    Y:['雪女','Snow Maiden','❄',-1,-1], F:['火車','Fire Cat','♨',1,1],
    K:['河童','Kappa','◉',0,0], H:['一つ目小僧','One-eyed Kid','●',0,0],
    T:['天狗','Tengu','◆',1,0], U:['海坊主','Sea Monk','◒',-1,0],
    N:['化け猫','Cat Spirit','✦',0,1], Z:['座敷童子','House Spirit','✿',0,-1]
  };
  // name, arrivals, base temperatures, turn limit, required smiles, conditions
  const nights = [
    ['初めての暖簾','First Lantern','YFK',[0,0],6,3],
    ['ふたり席','Room for Two','HKFY',[0,0],7,4],
    ['乾いた風','Dry Wind','TFKUY',[0,0],8,5,{dry:true}],
    ['雨宿り','Shelter from Rain','UZKHFT',[0,0],9,5],
    ['片釜の夜','Broken Boiler','NFYYKZH',[0,0],10,6,{lock:0}],
    ['天狗の風','Tengu Wind','TTKUFNZ',[0,0],10,6],
    ['桶ひとつ','One Bath Only','HYFKZ',[0],10,4],
    ['冷めた湯','Cold Start','ZNHKTFU',[-1,0],11,6],
    ['火の祭り','Fire Festival','FNFTKUZH',[1,0],12,7,{lock:0}],
    ['波の音','Sound of Waves','UUHZKTNF',[0,-1],12,7,{dry:true}],
    ['常連たち','The Regulars','HKZNYFTU',[0,0],11,8],
    ['最後の灯','Last Lantern','YFHTUKNZK',[-1,0,1],12,9,{dry:true,lock:0}]
  ];
  const clamp = n => Math.max(-1,Math.min(1,n));
  const temp = b => clamp(b.base+b.people.reduce((n,p)=>n+guests[p.id][3],0));
  const happy = (p,b) => temp(b)===guests[p.id][4] && (p.id!=='H'||b.people.length>=2);
  const start = n => ({turn:0,served:0,lost:0,queue:n[2].split('').map(id=>({id,age:0})),baths:n[3].map(base=>({base,people:[]}))});
  const done = (s,n) => s.turn>=n[4] || (!s.queue.length && s.baths.every(b=>!b.people.length));
  const actions = (s,n) => {
    if(done(s,n)) return [];
    const a=[['wait']];
    s.baths.forEach((b,i)=>{
      if(s.queue.length&&b.people.length<3) a.push(['seat',i]);
      if(n[6]?.lock!==i) for(const d of [-1,1]) if(clamp(b.base+d)!==b.base) a.push(['heat',i,d]);
      b.people.forEach((p,k)=>s.baths.forEach((other,j)=>{
        if(i!==j&&other.people.length<3) a.push(['move',i,k,j]);
      }));
    });
    return a;
  };
  const step = (s,n,a) => {
    if(!Array.isArray(a)||!actions(s,n).some(x=>x.length===a.length&&x.every((v,i)=>v===a[i]))) return s;
    const z=structuredClone(s), [type,i,k,j]=a;
    if(type==='seat') z.baths[i].people.push({id:z.queue.shift().id,streak:0});
    if(type==='heat') z.baths[i].base+=k;
    if(type==='move') z.baths[j].people.push(z.baths[i].people.splice(k,1)[0]);
    z.turn++;
    for(const b of z.baths){
      for(const p of b.people) p.streak=happy(p,b)?p.streak+1:0;
      b.people=b.people.filter(p=>{if(p.streak<2)return true;z.served++;return false;});
    }
    // Only the guest at the counter has entered the dry waiting room.
    if(n[6]?.dry&&type!=='seat'&&z.queue[0]?.id==='K'&&++z.queue[0].age>=3){z.queue.shift();z.lost++;}
    return z;
  };
  // Search legal moves from the current board. Bound work on slower devices.
  function hint(s,n){
    if(s.served>=n[5])return {status:'met'};
    const possible=z=>n[2].length-z.lost>=n[5]&&z.served+(n[4]-z.turn)*z.baths.length*3>=n[5];
    const seen=new Set();
    let budget=6500;
    const rank=z=>z.served*12-z.queue.length*4+z.baths.reduce((sum,b)=>sum+b.people.reduce((v,p)=>v+2*p.streak,0),0);
    function search(z){
      if(z.served>=n[5])return [];
      if(done(z,n)||!possible(z))return null;
      const key=JSON.stringify(z);
      if(seen.has(key)||budget<=0)return null;
      seen.add(key);budget--;
      const next=actions(z,n).map(a=>[a,step(z,n,a)]).sort((a,b)=>rank(b[1])-rank(a[1]));
      for(const [a,after] of next){
        const route=search(after);
        if(route)return [a,...route];
        if(budget<=0)return null;
      }
      return null;
    }
    const route=search(s);
    return route?{status:'move',action:route[0]}:{status:budget<=0?'unknown':'blocked'};
  }
  return {guests,nights,temp,happy,start,step,actions,done,hint};
})();
if(typeof module!=='undefined') module.exports=Bath;
