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
    ['最後の灯','Last Lantern','YFHTUKNZK',[-1,0,1],12,9,{dry:true,lock:0}],
    ['湯分けの晩','Shared Water','KHKNK',[-1,1],8,5,{gate:true}],
    ['水路のいたずら','Crossed Currents','NTZUHKFY',[-1,1],12,7,{gate:true}],
    ['連れ風呂の晩','Bath for Two','HYKFN',[0,0],8,5,{pair:true}],
    ['空けておいた席','A Seat Saved','THUNFKYZ',[0,0],12,7,{pair:true}],
    ['残り湯の晩','Lingering Warmth','FNZYKU',[0,0],9,6,{echo:true}],
    ['瓶牛乳で乾杯','A Milk-Bottle Toast','YFNHKZTUK',[0,0,0],13,9,{echo:true}]
  ];
  const clamp = n => Math.max(-1,Math.min(1,n));
  const temp = b => clamp(b.base+(b.echo??0)+b.people.reduce((n,p)=>n+guests[p.id][3],0));
  const partner = id=>id==='H'?'K':id==='K'?'H':null;
  const happy = (p,b,n) => temp(b)===guests[p.id][4] &&
    (n?.[6]?.pair&&partner(p.id)?b.people.some(q=>q.id===partner(p.id)):(p.id!=='H'||b.people.length>=2));
  // Each night awards a full-house stamp and one optional challenge stamp.
  // [maximum turns, forbidden action, Japanese title, English title]
  const specials=[
    [4,null,'手際よし','Quick Service'],
    [null,'move','席替えなし','Stay Seated'],
    [null,'heat','釜いらず','Untouched Boiler'],
    [null,'wait','雨でも手際よく','Busy in the Rain'],
    [8,null,'片釜の名人','Boiler Whisperer'],
    [null,'move','天狗はそのまま','Settled Tengu'],
    [8,null,'一槽の早業','One-Bath Wonder'],
    [null,'wait','冷めぬ段取り','Keep It Moving'],
    [10,null,'祭りの早仕舞い','Festival Sprint'],
    [null,'wait','波に乗って','Ride the Wave'],
    [9,null,'常連の呼吸','In Sync'],
    [null,'heat','最後の灯をそのままに','Leave the Lantern Lit'],
    [7,null,'湯分け上手','Water Keeper'],
    [null,'move','流れにまかせて','Go with the Flow'],
    [null,'move','ふたりで並んで','Side by Side'],
    [null,'wait','席を空ける手際','Make Room'],
    [null,'move','残り湯じょうず','Lingering Touch'],
    [null,'wait','乾杯の段取り','Ready for the Toast']
  ];
  const start = n => ({turn:0,served:0,lost:0,used:0,queue:n[2].split('').map(id=>({id,age:0})),baths:n[3].map(base=>({base,people:[]}))});
  const mask={seat:1,move:2,heat:4,wait:8,gate:16};
  function awards(s,n,i){
    const [limit,ban]=specials[i];
    return (s.served===n[2].length?1:0)|
      (s.served>=n[5]&&(!limit||s.turn<=limit)&&(!ban||(Number.isInteger(s.used)&&!(s.used&mask[ban])))?2:0);
  }
  const done = (s,n) => s.turn>=n[4] || (!s.queue.length && s.baths.every(b=>!b.people.length));
  const actions = (s,n) => {
    if(done(s,n)) return [];
    const a=[['wait']];
    s.baths.forEach((b,i)=>{
      if(s.queue.length&&b.people.length<3) a.push(['seat',i]);
      if(!n[6]?.gate&&n[6]?.lock!==i) for(const d of [-1,1]) if(clamp(b.base+d)!==b.base) a.push(['heat',i,d]);
      if(n[6]?.gate&&b.base<1&&s.baths[1-i].base>-1)a.push(['gate',i]);
      b.people.forEach((p,k)=>s.baths.forEach((other,j)=>{
        if(i!==j&&other.people.length<3) a.push(['move',i,k,j]);
      }));
    });
    return a;
  };
  const step = (s,n,a) => {
    if(!Array.isArray(a)||!actions(s,n).some(x=>x.length===a.length&&x.every((v,i)=>v===a[i]))) return s;
    const z={...s,queue:s.queue.map(p=>({...p})),baths:s.baths.map(b=>({...b,people:b.people.map(p=>({...p}))}))};
    const [type,i,k,j]=a;
    if(Number.isInteger(s.used))z.used|=mask[type];
    if(type==='seat') z.baths[i].people.push({id:z.queue.shift().id,streak:0});
    if(type==='heat') z.baths[i].base+=k;
    if(type==='gate'){z.baths[i].base++;z.baths[1-i].base--;}
    if(type==='move') z.baths[j].people.push(z.baths[i].people.splice(k,1)[0]);
    z.turn++;
    for(const b of z.baths){
      for(const p of b.people) p.streak=happy(p,b,n)?p.streak+1:0;
      if(n[6]?.echo)b.echo=b.people.reduce((sum,p)=>sum+(p.streak>=2?guests[p.id][3]:0),0);
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
    if(route)return {status:'move',action:route[0]};
    if(budget>0)return {status:'blocked'};
    // Try promising boards across each turn when depth-first search spends its budget.
    let layer=[[s,null]];
    for(let t=s.turn;t<n[4]&&layer.length;t++){
      const next=new Map();
      for(const [z,first] of layer)for(const a of actions(z,n)){
        const after=step(z,n,a);
        if(after.served>=n[5])return {status:'move',action:first??a};
        if(done(after,n)||!possible(after))continue;
        const key=JSON.stringify(after);
        if(!next.has(key))next.set(key,[after,first??a]);
      }
      layer=[...next.values()].sort((a,b)=>rank(b[0])-rank(a[0])).slice(0,180);
    }
    return {status:'unknown'};
  }
  return {guests,nights,specials,awards,temp,happy,partner,start,step,actions,done,hint};
})();
if(typeof module!=='undefined') module.exports=Bath;
