(() => {
const {guests,nights,specials,awards,temp,partner,start,step,actions,done}=Bath;
const app=document.querySelector('#app');
const key='yokai-bathhouse-v1';
function read(){try{return JSON.parse(localStorage.getItem(key))||{}}catch{return {}}}
const data=read();
function readLanguage(){try{return localStorage.getItem(key+'-lang')??data.lang}catch{return data.lang}}
const score=(d,i)=>Number.isInteger(d.best?.[i])&&d.best[i]>=0&&d.best[i]<=nights[i][2].length?d.best[i]:0;
let lang=readLanguage()==='en'?1:0, best=nights.map((_,i)=>score(data,i));
const savedStamps=(d,i)=>(Number.isInteger(d.stamps?.[i])?d.stamps[i]&3:0)|(score(d,i)===nights[i][2].length?1:0);
let stamps=nights.map((_,i)=>savedStamps(data,i)), earned=0;
let index=0,s=null,view='menu',message=null,recorded=false,saveFailed=false,guideOpen=false;
let hintOpen=false,hintResult=null;
let arrival=null;
const compact=matchMedia('(max-width: 600px) and (orientation: portrait), (max-width: 950px) and (max-height: 480px) and (orientation: landscape)');
let activeBath=0,sheet=null,turnReport=null;
let companionObserver=null;
let previousTurn=null;
const tr=(ja,en)=>lang?en:ja;
const name=id=>guests[id][lang];
const temperature=t=>[tr('❄ ぬる湯','❄ Cool'),'≈ '+tr('適温','Warm'),tr('♨ 熱湯','♨ Hot')][t+1];
const heatTone=t=>t<0?'cool':t>0?'hot':'warm';
function tempBadge(t,context=''){
 return `<span class="temp-badge" data-temp="${heatTone(t)}">${context?`<span class="temp-context">${context}</span>`:''}<strong>${temperature(t)}</strong></span>`;
}
const n=()=>nights[index];
const unlocked=i=>i===0||best[i-1]>=nights[i-1][5];
const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
function validShift(value){
 if(!int(value?.index,0,nights.length-1)||!unlocked(value.index))return false;
 const level=nights[value.index], q=value.s, total=level[2].length;
 const validId=p=>p&&typeof p.id==='string'&&Object.prototype.hasOwnProperty.call(guests,p.id);
 return q&&int(q.turn,0,level[4]-1)&&int(q.served,0,total)&&int(q.lost,0,total)&&
   Array.isArray(q.queue)&&q.queue.every(p=>validId(p)&&int(p.age,0,2))&&
   Array.isArray(q.baths)&&q.baths.length===level[3].length&&q.baths.every(b=>b&&int(b.base,-1,1)&&
     (b.echo===undefined||Boolean(level[6]?.echo)&&int(b.echo,-3,3))&&
     Array.isArray(b.people)&&b.people.length<=3&&b.people.every(p=>validId(p)&&int(p.streak,0,1)))&&
   q.served+q.lost+q.queue.length+q.baths.reduce((a,b)=>a+b.people.length,0)===total&&!done(q,level);
}
let suspended=validShift(data.shift)?data.shift:null, revision=data.revision??null, conflict=false;
function save(allowEmpty=false){
 const shift=view==='play'?{index,s,previousTurn}:suspended;
 const write=()=>{
 try{
   const latest=read();
   best=best.map((v,i)=>Math.max(v,score(latest,i)));
   stamps=stamps.map((v,i)=>v|savedStamps(latest,i));
   const owns=(latest.revision??null)===revision||(allowEmpty&&!latest.shift);
   conflict=!owns;
   const nextRevision=owns?String(Date.now())+'-'+Math.random():latest.revision;
   localStorage.setItem(key,JSON.stringify({best,stamps,revision:nextRevision,shift:owns?shift:latest.shift}));
   if(owns)revision=nextRevision;
   saveFailed=false;
 }catch{saveFailed=true}
 };
 if(!navigator.locks?.request){write();return Promise.resolve()}
 return navigator.locks.request(key,write).catch(()=>{saveFailed=true});
}
const title=()=>tr('妖怪銭湯','Yokai Bathhouse');
function top(){return `<header class="top"><span class="brand">♨ YŌKAI BATHHOUSE</span><div class="tools">${view==='menu'?'':`<button data-nav="menu">${tr('営業日一覧','Night list')}</button>`}<button data-nav="language" aria-label="${tr('Switch to English','日本語に切り替え')}">${tr('English','日本語')}</button></div></header>`}
const art=`<svg viewBox="0 0 440 175" aria-hidden="true"><circle cx="331" cy="46" r="31" fill="#ffd38b"/><path fill="#405e69" d="M0 139 96 89l49 28L228 33l107 101 65-31 40 30v42H0z"/><path fill="#e1e6db" d="m194 68 34-35 42 40-23-7-13 9-13-13-12 9z"/><path fill="#172b35" d="M65 100h158l31 22H36zM53 122h183v46H53z"/><path fill="#c96d52" d="M110 124h71v32h-71z"/><path stroke="#ffd38b" stroke-width="2" d="M134 125v31m23-31v31"/><text x="145" y="148" text-anchor="middle" fill="#fff3d9" font-size="22">ゆ</text><path fill="#ffd38b" d="M73 132h22v19H73zm122 0h22v19h-22z"/><path stroke="#daeae5" fill="none" opacity=".8" stroke-linecap="round" stroke-width="4" d="M299 150q-12-12 0-24t0-23m24 47q-12-12 0-24t0-23m24 47q-12-12 0-24t0-23"/><path stroke="#83b5b0" stroke-width="3" d="M0 168h440"/></svg>`;
const stories=[
 ['雪女が暖簾の前で足を止めた。「ここ、冷ましてもいいの？」','The Snow Maiden pauses at the curtain. “Is it all right if I cool things down?”'],
 ['一つ目小僧は、ひとりきりの湯船をのぞきこんだ。','The One-eyed Kid peers into the empty bath.'],
 ['風が乾いている。河童は頭の皿を押さえてやってきた。','The wind is dry. Kappa arrives with one hand over the water-filled plate on his head.'],
 ['雨の音にまぎれて、海坊主が静かに暖簾をくぐった。','A Sea Monk slips in under the sound of the rain.'],
 ['左の釜が故障中。化け猫は熱いお湯を待っている。','The left boiler is out. Cat Spirit is waiting for a hot soak.'],
 ['天狗が二人。羽うちわは脱衣棚に預けてもらった。','Two Tengu tonight. Both leave their fans on the shelf.'],
 ['湯船はひとつだけ。今日は譲り合いの日だ。','Only one bath is open. Tonight, everyone must share.'],
 ['先に張ったお湯が冷めてしまった。外にはもう客がいる。','The first bath has cooled, and guests are already outside.'],
 ['祭り帰りの火車たちが、太鼓の調子で戸を叩く。','Fire Cats knock on the door to the rhythm of the festival drums.'],
 ['海坊主がふたり、肩を並べて順番を待っている。','Two Sea Monks wait side by side, like waves before the shore.'],
 ['河童は一つ目小僧のために隣を空けた。「今夜も、ここだよ」','Kappa leaves a spot beside him for the One-eyed Kid. “Saved you a seat.”'],
 ['いつもの顔がそろった。最後の灯を、あたたかく残そう。','All the familiar faces are here. Let the last lantern burn warm.']
];
function guide(){return `<details><summary>${tr('遊び方・妖怪帳','How to play & guest book')}</summary><p>${tr('列の先頭を案内・客を移動・湯を調整・待つ。どれも１手。各湯船は３人まで。好みの湯で２手連続過ごすと満足して帰ります。','Seat the first guest, move a bather, adjust a bath, or wait. Each costs one turn. Baths hold three. Guests leave happy after two consecutive comfortable turns.')}</p><p>${tr('湯温は設定温度＋入浴中の妖怪の効果。釜が壊れた湯船も、妖怪の効果では温度が変わります。','Bath temperature combines the setting with the effects of current bathers. Guests still affect baths with broken boilers.')}</p><ul>${Object.entries(guests).map(([id,g])=>`<li>${g[2]} ${name(id)} · ${temperature(g[4])} ${g[3]? ' / '+(g[3]>0?tr('湯を温める','heats bath'):tr('湯を冷やす','cools bath')):''} ${id==='H'?tr('／相席が必要',' / needs company'):''}${id==='K'?tr('／乾いた夜は先頭で３手経つと帰る',' / leaves after 3 turns at the head of the line on dry nights'):''}</li>`).join('')}</ul></details>`}
function nightButtons(from,to){return nights.slice(from,to).map((x,k)=>{const i=from+k;return `<button data-level="${i}" ${unlocked(i)?'':'disabled'}>${String(i+1).padStart(2,'0')} · ${x[lang]}<br><small>${unlocked(i)?`${tr('最高','Best')} ${best[i]}/${x[2].length}`:'🔒'}</small></button>`}).join('')}
function menu(){return `<section class="hero">${art}<div class="eyebrow">${tr('終電のあと、暖簾が開く','AFTER THE LAST TRAIN')}</div><h1>${title()}</h1><p>${tr('雪女で冷まし、火車で温める。今夜も、妖怪たちにいい湯を。','Cool the water with a snow spirit. Warm it with a fire cat. Give every yokai a good soak.')}</p><div class="row">${suspended?`<button class="primary" data-nav="resume">${tr('営業を再開','Resume shift')}</button>`:`<button class="primary" data-level="${Math.max(0,nights.findIndex((x,i)=>best[i]<x[5]))}">${tr('暖簾を開ける','Open the bathhouse')}</button>`}</div></section><section class="panel"><h2>${tr('本編・裏営業','Main Nights & After Hours')}</h2><p class="muted">${tr('本編12晩をクリアすると裏営業の第1晩が開きます。以降も1晩ずつ解放されます。','Clear the 12 main nights to open the first After Hours shift. Clear each shift to unlock the next.')}</p><div class="levels">${nightButtons(0,12)}</div><h2 class="after-hours-heading">${tr('裏営業 · 6晩','After Hours · 6 nights')}</h2><div class="levels">${nightButtons(12,nights.length)}</div></section>${guide()}`}
const faces={
 Y:['#a9d5f0','M5 17Q2 2 16 2T27 17L24 25H8Z','M7 12 13 6l2 7 9-3'],
 F:['#ffa077','M4 17 5 4l8 6h6l8-6 1 13Q28 28 16 28T4 17Z','M13 7 17 1l3 7'],
 K:['#a9d39c','M4 17Q4 7 16 7t12 10q0 11-12 11T4 17Z','M8 8h16l-3 4H11zM12 23h8'],
 H:['#e6b0e2','M5 17Q5 4 16 4t11 13q0 11-11 11T5 17Z','M8 16q8-12 16 0-8 12-16 0Z'],
 T:['#f49791','M5 17Q5 6 16 6t11 11q0 11-11 11T5 17Z','M13 6V2h6v4m-3 11 10 4-10 2'],
 U:['#8ec7dc','M4 24V14a12 12 0 0 1 24 0v10l-5 4-7-4-7 4Z','M5 26q4-4 8 0t8 0 8 0'],
 N:['#ffd28a','M4 17V4l9 6h6l9-6v13q0 11-12 11T4 17Z','M4 20h6m-6 4 6-1m18-3h-6m6 4-6-1'],
 Z:['#ffb6a4','M4 21V13a12 12 0 0 1 24 0v8l-6 7H10Z','M6 13h20M12 23q4 3 8 0']
};
const guestLabel=id=>{
 const [color,shape,marks]=faces[id];
 return `<span class="portrait"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="${color}" d="${shape}"/><path stroke="#213441" stroke-width="1.5" fill="none" stroke-linejoin="round" d="${marks}"/>${id==='H'?'<circle cx="16" cy="16" r="3" fill="#213441"/>':'<path stroke="#213441" stroke-width="2.8" stroke-linecap="round" d="M11 17h.1m9.9 0h.1"/>'}</svg> ${name(id)}</span>`;
};
const costumes={
 Y:['#a7d9f3','#e8f6ff','<path fill="#435779" d="M17 48V33a27 27 0 0 1 54 0v21l-9-6V31L46 20 30 33v18z"/><path fill="#fff" d="m61 15 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>'],
 F:['#fcb273','#ffe0ab','<path fill="#fcb273" d="m17 33 2-22 19 11h13l17-11 4 23z"/><path fill="#dd6559" d="m23 17 10 8-11 4zm40 1 3 11-11-4z"/><path fill="#f3824d" d="M39 19q-1-5 7-12-1 5 4 8t-1 8z"/>'],
 K:['#a9d597','#f8df9f','<path fill="#568f73" d="M21 32q3-16 23-16t24 16l-12-5-9 4-13-4z"/><path fill="#dfefad" stroke="#375f52" stroke-width="2" d="M28 14h32l-6 8H34z"/>'],
 H:['#d6a7df','#f5c6d7','<path fill="#775c98" d="m21 30 5-13 12 4 7-9 7 9 10-3 5 12z"/>'],
 T:['#f0a093','#ffcf9c','<path fill="#574966" d="m34 23 3-11h14l4 11z"/><path fill="#faf1d0" d="m14 34 5-8 5 8zm51 0 5-8 5 8z"/>'],
 U:['#87bacc','#b4e5e8','<path fill="#5d899f" d="M20 38q1-22 24-22t24 22l-13-9-11 3-11-3z"/>'],
 N:['#ffd394','#fff0c8','<path fill="#ffd394" d="m17 34 2-21 18 11h14l18-11 2 21z"/><path fill="#e6898b" d="m24 19 9 8-10 2zm40 0 1 10-10-2z"/>'],
 Z:['#ffc5ae','#ffe5ad','<path fill="#60445e" d="M17 40v-8a27 25 0 0 1 54 0v8l-7-10H24z"/><circle cx="64" cy="23" r="5" fill="#f7c375"/>']
};
function doll(id,mood='calm',dry=false){
 const [skin,body,hat]=costumes[id], ink='#383448';
 const eye=mood==='happy'?'<path d="M29 39q4-6 8 0m14 0q4-6 8 0"/>':mood==='worried'?'<path d="m29 36 8 5m14 0 8-5"/>':'<path class="blink" d="M33 39h.1m22 0h.1" stroke-width="4.4"/>';
 return `<svg class="doll is-${mood}" viewBox="0 0 88 76" aria-hidden="true">
 <ellipse cx="44" cy="69" rx="28" ry="4" fill="#192a35" opacity=".25"/>
 <path d="M24 66q0-17 20-17t20 17q-20 9-40 0Z" fill="${body}" stroke="${ink}" stroke-width="2"/>
 <ellipse cx="44" cy="40" rx="26" ry="20" fill="${skin}" stroke="${ink}" stroke-width="2"/>
 ${hat}<g fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round">${id==='H'?'<ellipse cx="44" cy="39" rx="8" ry="5" fill="#fff"/><path d="M44 39h.1" stroke-width="4"/>':eye}
 ${id==='T'?'<path d="M44 40l15 5-14 2" fill="#ffad9c"/>':id==='K'?'<ellipse cx="44" cy="48" rx="9" ry="4" fill="#ffe39e"/>':''}
 <path d="${mood==='happy'?'M39 51q5 7 10 0':mood==='worried'?'M40 54q4-5 8 0':'M41 52q3 2 6 0'}"/></g>
 <g fill="#ee838b" opacity=".55"><ellipse cx="27" cy="47" rx="5" ry="2.5"/><ellipse cx="61" cy="47" rx="5" ry="2.5"/></g>
 ${id==='K'?(dry?'<path d="M19 36q-5-14 9-20m41 20q5-14-9-20" fill="none" stroke="#74aa79" stroke-width="6" stroke-linecap="round"/>':'<path d="M34 15q5 3 10 0t10 0" stroke="#8adcf2" stroke-width="2.6" fill="none"/>'):''}
 ${mood==='happy'?'<path d="M72 33v10m-5-5h10M12 48v8m-4-4h8" stroke="#ffe6a6" stroke-width="2" stroke-linecap="round"/>':mood==='worried'?'<path d="M73 31q-7 9 0 9t0-9" fill="#b9efff"/>':''}</svg>`;
}
function bathScene(b,i){
 const t=temp(b);
 return `<div class="bath-scene" aria-hidden="true"><div class="bath-water"></div>
 ${t>=0?`<div class="vapor">${'<i></i>'.repeat(t===1?3:1)}</div>`:'<div class="ice-stars">❄　·　❄</div>'}
 <div class="bathers">${b.people.map((p,k)=>`<span class="${arrival?.[0]===i&&arrival?.[1]===k?'splash':''}">${doll(p.id,p.streak?'happy':'worried')}</span>`).join('')}</div><div class="bath-rim"></div></div>`;
}
function comfort(p,b){
 if(temp(b)!==guests[p.id][4])return tr('湯温が合わない','Wrong temperature');
 if(n()[6]?.pair&&partner(p.id)&&!b.people.some(q=>q.id===partner(p.id)))return tr(`${name(partner(p.id))}を待っています`,`Waiting for ${name(partner(p.id))}`);
 if(p.id==='H'&&b.people.length<2)return tr('相席待ち','Needs company');
 return p.streak?tr('✓ 快適','✓ Comfy'):tr('次の手から快適','Comfy next turn');
}
function action(a,label,cls='',id='',accessible=''){return `<button class="${cls}" data-action="${a.join(',')}" ${id?`aria-describedby="${id}"`:''} ${accessible?`aria-label="${accessible}"`:''}>${label}</button>`}
function hintText(){
 if(!hintResult&&n()[6]?.gate)return tr('河童や一つ目小僧には適温が必要です。片方がぬる湯でも、もう片方が熱湯なら、ぬるい方へ熱を移すと両方を適温にできます。','Kappa and the Kid need warm water. If one setting is Cool and the other Hot, transfer heat toward the cooler bath to bring both settings to Warm.');
 if(!hintResult&&n()[6]?.pair)return tr('河童と小僧のために、同じ湯船に2席を確保しましょう。その間、ほかの客にはもう一方の湯船を使えます。','Save two seats in one bath for Kappa and the Kid. Use the other bath to serve guests while they wait to reunite.');
 if(!hintResult&&n()[6]?.echo){
   const i=s.baths.findIndex(b=>b.echo);
   if(i>=0)return tr(`湯船${i+1}に${s.baths[i].echo>0?'あたたかさ':'冷たさ'}が残っています。次の手の判定には効きますが、そのあとの湯温は変わるので予告を見比べましょう。`,`Bath ${i+1} still holds a ${s.baths[i].echo>0?'heating':'cooling'} effect. Compare the temperature for this turn with the temperature afterward before seating anyone.`);
   return tr('火車や雪女が帰る手を見越して、次の客が残り湯を使えるように席を空けておきましょう。','When Fire Cat or the Snow Maiden is about to leave, keep a seat free so the next guest can use their lingering effect.');
 }
 if(!hintResult)return index===2
  ?tr('河童は列の先頭で案内されずに３手経つと帰ります。天狗と火車を同席させるなら、河童用に別の適温の湯船を残しましょう。火車の退浴後、適温設定の湯船で海坊主が天狗の加温を打ち消せます。','Kappa leaves after three turns waiting at the front. If Tengu and Fire Cat share a bath, keep another bath warm for Kappa. Once Fire Cat leaves, Sea Monk can cancel out Tengu’s heat in a bath set to Warm.')
  :tr('次の客の好みと、今いる客が帰ったあとの湯温を見比べましょう。','Compare what the next guest wants with how the bath will change when current guests leave.');
 const {status,action:a}=hintResult;
 if(status==='met')return tr('目標達成済みです。残りの客を迎えるか、閉店まで進めましょう。','Goal met. Serve the remaining guests or play until closing.');
 if(status==='blocked')return previousTurn?tr('今の盤面からは目標に届きません。まず「1手戻す」を試すか、今夜をやり直せます。','The goal is no longer reachable. Try undoing the last turn, or restart the night.'):tr('今の盤面からは目標に届きません。「今夜をやり直す」で再挑戦できます。','The goal is no longer reachable from this board. Try restarting the night.');
 if(status==='unknown')return tr('この盤面では攻略手順を見つけられませんでした。まだクリアできる可能性はあります。','No route was found within the search limit. The board may still be solvable.');
 const [type,i,k,j]=a;
 if(type==='seat')return tr(`${name(s.queue[0].id)}を湯船${i+1}に案内しましょう。`,`Seat ${name(s.queue[0].id)} in Bath ${i+1}.`);
 if(type==='heat')return tr(`湯船${i+1}を${k>0?'温めましょう':'冷ましましょう'}。`,`${k>0?'Heat':'Cool'} Bath ${i+1}.`);
 if(type==='gate')return tr(`湯船${i+1}へ熱を移す栓を開けましょう。`,`Open the valve to heat Bath ${i+1}.`);
 if(type==='move')return tr(`湯船${i+1}の${name(s.baths[i].people[k].id)}を湯船${j+1}へ移しましょう。`,`Move ${name(s.baths[i].people[k].id)} from Bath ${i+1} to Bath ${j+1}.`);
 return tr('誰も移動させず、１手待ちましょう。','Wait one turn without moving anyone.');
}
function nightRule(){
 const flags=n()[6];
 if(flags?.gate)return tr('水路の栓を開けると、指定の湯船の設定が1段上がり、もう片方が1段下がります。釜は使えません。','A valve raises one bath’s setting by one step and lowers the other. The boilers are unavailable.');
 if(flags?.pair)return tr('河童と一つ目小僧は、同じ適温の湯船にいるときだけ快適になります。','Kappa and the One-eyed Kid only get comfortable when they share a warm bath.');
 if(flags?.echo)return tr('満足して退浴した妖怪の加温・冷却効果が、次の1手だけ湯船に残ります。','A happy guest’s heating or cooling effect lingers for one turn after they leave.');
 return '';
}
function nightStory(){
 return [
   tr('暖簾を片づけていると、一つ目小僧が戸を叩いた。「もう一回だけ、いい？」','As you take down the curtain, the Kid knocks. “Could we have one more bath?”'),
   tr('天狗が栓をひねると、隣の湯船から湯気が立った。','Tengu turns a valve, and steam rises from the other bath.'),
   tr('小僧と河童は、二人で入れる湯船を探している。','The Kid and Kappa are looking for a bath they can share.'),
   tr('今夜は待ち列が長い。小僧は河童のぶんまで手ぬぐいを持ってきた。','The line is long tonight. The Kid brought an extra towel for Kappa.'),
   tr('火車が上がったあとも、湯にあたたかさが残っている。','Fire Cat climbs out, but a little warmth lingers in the bath.'),
   tr('瓶牛乳を冷やしておこう。今夜は乾杯する約束だ。','Put the milk bottles on ice. Tonight everyone has promised to stay for a toast.')
 ][index-12];
}
function toastArt(){
 const bottle='<path d="M14 5h12v8l4 7v24H10V20l4-7z" fill="#fff1c9" stroke="#72574c" stroke-width="2"/><path d="M12 4h16v5H12z" fill="#e98372"/><path d="M11 23h18v9H11z" fill="#9accc2"/>';
 return `<div class="toast-art" aria-hidden="true">${doll('H','happy')}<svg viewBox="0 0 80 55"><g transform="rotate(-20 20 25)">${bottle}</g><g transform="translate(40) rotate(20 20 25)">${bottle}</g><path d="M40 2v9m-9-5 4 6m14-6-4 6" stroke="#ffdf92" stroke-width="2"/></svg>${doll('K','happy')}</div>`;
}
function play(){
 const legal=actions(s,n()), head=s.queue[0];
 return `<section class="panel"><div class="eyebrow">${tr('第','NIGHT ')}${index+1}${tr('晩','')} / ${nights.length}${index>=12?' · '+tr('裏営業','AFTER HOURS'):''}</div><h2>${n()[lang]}</h2><p class="scene">${stories[index]?.[lang]??nightStory()}</p>${nightRule()?`<p class="night-rule">${nightRule()}</p>`:''}<div class="stats"><span>${tr('残り','Turns left')} ${n()[4]-s.turn}</span><span>${tr('満足','Happy')} ${s.served}/${n()[5]}</span><span>${tr('帰った','Walked out')} ${s.lost}</span></div></section>
 <section class="overview" aria-label="${tr('営業状況','Shift overview')}">
 <div class="overview-top"><strong>${head?tr('次：','Next: ')+guestLabel(head.id):tr('待ち客なし','Queue empty')}</strong><span>${tr('残り','Left')} ${n()[4]-s.turn} · ${tr('目標','Goal')} ${s.served}/${n()[5]}</span></div>
 ${head?`<div class="next-wants">${tr('好み：','Wants: ')}${temperature(guests[head.id][4])}${head.id==='K'&&n()[6]?.dry?` <b class="deadline">${tr('あと','Leaves in ')}${3-head.age}${tr('手で帰る',' turns')}</b>`:''}</div>`:''}
 <div class="overview-baths">${s.baths.map((b,i)=>`<a href="#bath-${i}"><strong>${tr('湯船','Bath')} ${i+1}</strong><span>${temperature(temp(b))} · ${b.people.length}/3</span></a>`).join('')}</div>
 <div class="overview-footer">${undoButton()}${message?`<div class="overview-note">${message[lang]}</div>`:''}</div></section>
 <details class="queue-panel"><summary>${tr('待ち列を見る','See the queue')} · ${s.queue.length}</summary><div class="queue">${s.queue.map((p,i)=>`<span class="chip">${i+1}. ${guestLabel(p.id)} · ${temperature(guests[p.id][4])}</span>`).join('')||tr('待ち客なし','No waiting guests')}</div></details>
 ${head?`<div class="reception">${doll(head.id,head.id==='K'&&n()[6]?.dry&&head.age>=1?'worried':'calm',head.id==='K'&&n()[6]?.dry)}<div><small>${tr('暖簾の前でお待ちです','AT THE CURTAIN')}</small><strong>${name(head.id)}</strong><span>${tr('好み：','Wants: ')}${temperature(guests[head.id][4])}</span></div></div>`:''}
 <div class="hint-tools"><button data-nav="hint" aria-expanded="${hintOpen}">${hintOpen?tr('ヒントを閉じる','Hide hint'):tr('ヒント','Hint')}</button>
 ${hintOpen?`<div class="hint-card"><p role="status">${hintText()}</p>${hintResult?'':`<button data-nav="hint-move">${tr('次の一手を見る','Show next move')}</button>`}</div>`:''}</div>
 ${index===0&&(s.turn===0||(s.turn===1&&head?.id==='F'&&s.baths.some(b=>b.people.some(p=>p.id==='Y'))))?`<p class="panel muted">${s.turn===0?tr('雪女が入ると湯が冷えます。最初は湯を調整せず、どちらかに案内してみましょう。','The Snow Maiden cools the bath she enters. Try seating her without adjusting the water.'):tr('入浴中の全員を毎手チェックします。別の湯船に火車を案内しても、雪女の快適カウントは進みます。','Every action checks all bathers. Seating Fire Cat in the other bath also advances the Snow Maiden’s comfort count.')}</p>`:''}
 <div class="baths">${s.baths.map((b,i)=>{
 const canSeat=legal.find(a=>a[0]==='seat'&&a[1]===i);
 const preview=canSeat?temp({...b,people:[...b.people,head]}):null;
 const after=canSeat?temp(step(s,n(),canSeat).baths[i]):null;
 const gate=legal.find(a=>a[0]==='gate'&&a[1]===i);
 return `<section id="bath-${i}" class="bath ${temp(b)<0?'cold':temp(b)>0?'hot':''}"><h3>${tr('湯船','Bath')} ${i+1} · ${temperature(temp(b))}</h3><small>${tr('設定','Setting')}: ${temperature(b.base)} · ${b.people.length}/3 ${n()[6]?.lock===i?tr(' · 釜故障',' · boiler out'):''}${b.echo?` · ${tr('残り湯','Lingering heat')} ${b.echo>0?'+':''}${b.echo}`:''}</small>
 ${bathScene(b,i)}
 <ul class="people">${b.people.map((p,k)=>`<li>${guestLabel(p.id)} · ${temperature(guests[p.id][4])} · ${p.streak}/2 · ${comfort(p,b)}${legal.filter(a=>a[0]==='move'&&a[1]===i&&a[2]===k).map(a=>` <span class="move">${action(a,tr('→ 湯船','→ Bath')+' '+(a[3]+1),'','',tr(`${name(p.id)}を湯船${a[3]+1}へ移す`,`Move ${name(p.id)} to Bath ${a[3]+1}`))}</span>`).join('')}</li>`).join('')||`<li class="muted">${tr('空席','Empty')}</li>`}</ul>
 <div class="preview" id="preview-${i}">${preview===null?'':name(head.id)+' · '+tr('好み：','Wants ')+temperature(guests[head.id][4])+'<br>'+tr('この手の判定：','This turn: ')+temperature(preview)+(after!==preview?tr(' ／ 手終了後：',' / After the turn: ')+temperature(after):'')}</div><div class="actions">${canSeat?action(canSeat,tr('案内する','Seat guest'),'primary','preview-'+i,tr(`${name(head.id)}を湯船${i+1}に案内`,`Seat ${name(head.id)} in Bath ${i+1}`)):''}${gate?action(gate,tr(`栓：湯船${i+1}を温め、湯船${2-i}を冷ます`,`Valve: heat Bath ${i+1}, cool Bath ${2-i}`)):''}${legal.filter(a=>a[0]==='heat'&&a[1]===i).map(a=>action(a,a[2]>0?tr('＋ 温める','+ Heat'):tr('− 冷ます','− Cool'),'','',tr(`湯船${i+1}を${a[2]>0?'温める':'冷ます'}`,`${a[2]>0?'Heat':'Cool'} Bath ${i+1}`))).join('')}</div></section>`;
 }).join('')}</div><div class="row">${action(['wait'],tr('１手待つ','Wait a turn'))}<button data-nav="retry">${tr('今夜をやり直す','Restart night')}</button></div>
 ${guide()}`;
}
function undoButton(){return `<button data-nav="undo" ${previousTurn?'':'disabled'}>${tr('↶ 1手戻す','↶ Undo last turn')}</button>`}
function compactSheet(legal){
 if(!sheet)return '';
 const b=s.baths[activeBath];
 let heading,content;
 if(sheet==='adjust'){
   heading=tr(`湯船${activeBath+1}の操作`,`Bath ${activeBath+1} controls`);
   const controls=legal.filter(a=>a[1]===activeBath&&['heat','gate','move'].includes(a[0]));
   content=controls.map(a=>{
     const [type,i,k,j]=a, forecast={},after=step(s,n(),a,forecast);
     const label=type==='move'?tr(`席${k+1}：${name(b.people[k].id)} ${b.people[k].streak}/2 → 湯船${j+1}`,`Seat ${k+1}: ${name(b.people[k].id)} ${b.people[k].streak}/2 → Bath ${j+1}`):
       type==='gate'?tr(`栓：湯船${i+1}を温め、湯船${2-i}を冷ます`,`Valve: heat Bath ${i+1}, cool Bath ${2-i}`):
       k>0?tr('温める','Heat'):tr('冷ます','Cool');
     const affected=type==='gate'?[0,1]:type==='move'?[i,j]:[i];
     return `<div class="sheet-action">${action(a,label,'','forecast-'+a.join('-'))}<small id="forecast-${a.join('-')}">${affected.map(x=>{
       const t=forecast.temperatures[x], end=temp(after.baths[x]);
       return tr('湯船','Bath ')+(x+1)+'：'+tr('判定 ','Check ')+temperature(t)+(t!==end?tr(' → 手終了後 ',' → After turn ')+temperature(end):'');
     }).join(' ／ ')}</small></div>`;
   }).join('')||`<p>${tr('今この湯船でできる調整や移動はありません。','There are no adjustments or moves available for this bath.')}</p>`;
 }else if(sheet==='queue'){
   heading=tr('待ち列','Queue');
   content=s.queue.length?`<ol>${s.queue.map(p=>`<li>${guestLabel(p.id)} · ${temperature(guests[p.id][4])}</li>`).join('')}</ol>`:`<p>${tr('待ち客なし','Queue empty')}</p>`;
 }else if(sheet==='hint'){
   heading=tr('ヒント','Hint');
   content=`<p data-hint-answer tabindex="-1">${hintText()}</p>${hintResult?.status==='move'&&hintResult.action[0]!=='wait'?`<button data-nav="hint-show">${tr('対象の湯船を表示','Show the suggested bath')}</button>`:hintResult?'':`<button data-nav="hint-move">${tr('次の一手を見る','Show next move')}</button>`}`;
 }else if(sheet==='stamps'){
   heading=tr('今夜のおもてなし札','Tonight’s stamps');
   content=stampPanel(true);
 }else{
   heading=tr('今夜の情報','About this night');
   content=`<p>${stories[index]?.[lang]??nightStory()}</p>${nightRule()?`<p class="night-rule">${nightRule()}</p>`:''}${guide()}<div class="row"><button data-nav="retry">${tr('今夜をやり直す','Restart night')}</button><button data-nav="language">${tr('English','日本語')}</button></div>`;
 }
 return `<dialog class="play-sheet" aria-labelledby="sheet-title"><div class="sheet-head"><h2 id="sheet-title">${heading}</h2><button data-nav="sheet-close" autofocus>${tr('閉じる','Close')}</button></div><div class="sheet-content">${content}</div><button class="sheet-back" data-nav="sheet-close">${tr('盤面へ戻る','Back to board')}</button></dialog>`;
}
function companionBaths(){
 if(s.baths.length<2)return '';
 return `<div class="companion-space"><div class="companion-grid">${s.baths.map((b,i)=>{
   if(i===activeBath)return '';
   const t=temp(b), label=tr(`湯船${i+1}`,`Bath ${i+1}`);
   const occupants=b.people.map(p=>name(p.id)).join(tr('・',', '));
   const status=occupants||tr('空いています','Empty');
   return `<div class="companion-bath ${t<0?'cold':t>0?'hot':''}">
     <div class="companion-caption" aria-hidden="true"><strong>${label}</strong>${tempBadge(t,tr('現在','Now'))}<span class="companion-switch">${tr('切替','Switch')}</span></div>
     ${bathScene(b,i)}
     <div class="companion-guests" aria-hidden="true">${status}</div>
     <button class="companion-select" data-companion="${i}" aria-label="${tr(`${label}に切り替え：${temperature(t)}、${status}`,`Switch to ${label}: ${temperature(t)}, ${status}`)}"></button>
   </div>`;
 }).join('')}</div></div>`;
}
function compactPlay(){
 const legal=actions(s,n()), head=s.queue[0], i=activeBath,b=s.baths[i];
 const seat=legal.find(a=>a[0]==='seat'&&a[1]===i);
 const seating=seat?temp({...b,people:[...b.people,head]}):null;
 const later=seat?temp(step(s,n(),seat).baths[i]):null;
 const current=temp(b);
 const company=seat&&n()[6]?.pair&&partner(head.id)?!b.people.some(p=>p.id===partner(head.id)):seat&&head.id==='H'&&!b.people.length;
 const report=turnReport?.flatMap((ids,k)=>ids.length?[tr(`湯船${k+1}：${ids.map(name).join('・')}が満足して退浴`,`Bath ${k+1}: ${ids.map(name).join(', ')} left happy`)]:[]).join(tr(' ／ ',' · '));
 const blocked=s.lost>n()[2].length-n()[5];
 const canRecover=previousTurn&&previousTurn.lost<=n()[2].length-n()[5];
 const notice=blocked?(canRecover?tr('目標未達が確定。「1手戻す」で直前の手を試し直せます。','Goal out of reach. Undo to try a different last move.'):tr('目標未達が確定。「情報」から今夜をやり直せます。','Goal out of reach. Restart this night from Info.')):
   report&&s.lost>0?tr(`待ち列から帰った客：${s.lost}人`,`Walked out: ${s.lost}`):!report?message?.[lang]:'';
 return `<div class="compact-board">
 <div class="compact-heading"><h2>${index+1} · ${n()[lang]}</h2><button data-nav="menu">${tr('一覧','Night list')}</button></div>
 <section class="compact-overview" aria-label="${tr('営業状況','Shift overview')}" tabindex="-1">
 <div><strong>${head?tr('次：','Next: ')+guestLabel(head.id):tr('待ち客なし','Queue empty')}</strong> ${head?temperature(guests[head.id][4]):''}</div>
 <div><span>${tr('残り','Left')} ${n()[4]-s.turn} · ${tr('満足','Happy')} ${s.served}/${n()[5]}</span>${head?.id==='K'&&n()[6]?.dry?` <b class="deadline">${tr(`あと${3-head.age}手で帰る`,`Leaves in ${3-head.age}`)}</b>`:''}</div></section>
 ${saveFailed||conflict?`<div class="compact-note" role="status">${saveFailed?tr('進行を保存できません。','Progress could not be saved.'):tr('別タブが保存中です。このタブの中断は保存されません。','Another tab owns the save. This shift will not be saved here.')}</div>`:''}
 <div class="compact-tabs" role="group" aria-label="${tr('湯船を選ぶ','Choose a bath')}">${s.baths.map((bath,k)=>`<button data-bath="${k}" aria-pressed="${k===i}"><strong>${tr('湯船','Bath ')}${k+1}</strong><small data-temp="${heatTone(temp(bath))}">${temperature(temp(bath))} · ${tr('空','Free ')}${3-bath.people.length}</small><span class="tab-guests">${bath.people.map(p=>`<span title="${name(p.id)}">${guestLabel(p.id)}</span>`).join('')}${turnReport?.[k]?.length?'<span class="tab-departed" aria-hidden="true">✓</span>':''}</span></button>`).join('')}</div>
 <div class="compact-center" tabindex="0" role="region" aria-label="${tr('湯船と操作の予告','Bath and action forecast')}">
 <section class="compact-bath ${temp(b)<0?'cold':temp(b)>0?'hot':''}" aria-label="${tr('湯船','Bath ')}${i+1}">
 <div class="active-bath-caption"><strong>${tr('操作中：湯船','Active: Bath ')}${i+1}</strong>${tempBadge(current,tr('現在','Now'))}</div>
 ${bathScene(b,i)}
 <div class="compact-people">${b.people.map(p=>`<span>${name(p.id)} · ${p.streak}/2 · ${comfort(p,b)}</span>`).join('')||tr('空いています','Empty bath')}</div>
 <small>${tr('設定湯温：','Set temperature: ')}${temperature(b.base)}${b.echo?` · ${tr('残り湯：次の1手のみ','Lingering effect: next turn only')} ${b.echo>0?'+':''}${b.echo}`:''}</small>
 </section>
 <div class="compact-feedback"><div class="compact-preview" id="compact-preview">${seat?`${tempBadge(seating,tr(`湯船${i+1}へ案内した手の判定`,`Seating in Bath ${i+1}: check`))}${later!==seating?` ${tempBadge(later,tr('手終了後','After turn'))}`:''}${company?` <span class="preview-warning">${tr('相席が必要','Needs company')}</span>`:seating!==guests[head.id][4]?` <span class="preview-warning">${tr('客の好みと違う','Not the guest’s preferred temperature')}</span>`:''}`:head?tr('満席です。別の湯船を選べます。','Bath full. Try another bath.') :tr('待つと入浴中の客の判定が進みます。','Waiting advances the bathers’ comfort checks.')}</div>
 ${index===0&&s.turn===0?`<div>${tr('雪女が入ると湯が冷えます。そのまま案内してみましょう。','The Snow Maiden cools the bath. Try seating her as it is.')}</div>`:''}
 ${report?`<div class="compact-note">${report}</div>`:''}${notice?`<div class="compact-note">${notice}</div>`:''}</div></div>
 <div class="compact-footer-area">${companionBaths()}
 <div class="compact-bottom">
 <div class="compact-primary">${seat?action(seat,tr(`湯船${i+1}へ案内`,`Seat in Bath ${i+1}`),'primary','compact-preview',tr(`湯船${i+1}へ案内：${name(head.id)}`,`Seat in Bath ${i+1}: ${name(head.id)}`)):`<button class="primary" disabled>${tr('案内する','Seat guest')}</button>`}${action(['wait'],tr('1手待つ','Wait'))}${undoButton()}</div>
 <div class="compact-tools">
 ${[['adjust',tr('湯の操作','Bath controls')],['queue',tr('待ち列','Queue')],['hint',tr('ヒント','Hint')],['stamps',tr('札','Stamps')],['about',tr('情報','Info')]].map(([id,label])=>`<button data-sheet="${id}" aria-haspopup="dialog">${label}</button>`).join('')}
 </div>
 ${s.served>=n()[5]?`<button class="compact-close" data-nav="close">${tr('目標達成・閉店する','Goal met · Close now')}</button>`:''}</div></div>
 ${compactSheet(legal)}
 </div>`;
}
const stampGuests='YHKUFTZNFUHKFTKHUK';
function stampRule(i){
 const [limit,ban]=specials[i];
 return limit?tr(`${limit}手以内に目標人数を満足させて閉店`,`Meet the goal and close within ${limit} turns`):
   ({move:tr('客を移動させずにクリア','Clear without moving a bather'),heat:tr('釜で湯温を調整せずにクリア','Clear without adjusting the boiler'),wait:tr('「1手待つ」を使わずにクリア','Clear without using Wait a turn')})[ban];
}
function stampCard(i,bit){
 const full=bit===1, got=Boolean(stamps[i]&bit);
 const label=full?tr('全員満足','Full House'):specials[i][lang+2];
 return `<div class="stamp-card ${got?'collected':''}">${got?doll(stampGuests[i], 'happy'):'<span class="stamp-seal" aria-hidden="true">◇</span>'}<div><small>${tr('第','NIGHT ')}${i+1}${tr('晩','')} · ${got?tr('獲得済み','Collected'):tr('未獲得','Uncollected')}</small><strong>${label}</strong><span>${full?tr(`全${nights[i][2].length}人を満足させる`,`Send all ${nights[i][2].length} guests home happy`):stampRule(i)}</span></div></div>`;
}
let albumOpen=false;
function stampPanel(expanded=false){
 const count=stamps.reduce((sum,v)=>sum+Number(Boolean(v&1))+Number(Boolean(v&2)),0);
 if(view==='menu')return `<details class="stamp-album" ${albumOpen?'open':''}><summary>${tr('おもてなし帳','Hospitality Album')} · ${count}/${nights.length*2}</summary><p>${tr('各晩に2枚。札は任意で、次の晩の解放には通常クリアだけで十分です。','Two optional stamps per night. A regular clear is all you need to unlock the next night.')}</p><div class="stamp-grid">${nights.map((_,i)=>stampCard(i,1)+stampCard(i,2)).join('')}</div></details>`;
 if(view==='result')return `<section class="stamp-result"><h2>${earned?tr('おもてなし札を獲得！','New hospitality stamp!'):tr('今夜のおもてなし札','Tonight’s stamps')}</h2><div class="stamp-grid">${stampCard(index,1)+stampCard(index,2)}</div></section>`;
 const [limit,ban]=specials[index];
 const flag={move:2,heat:4,wait:8}[ban];
 const status=limit&&s.turn>limit||ban&&Number.isInteger(s.used)&&(s.used&flag)?tr('今回の挑戦条件は未達。通常クリアは可能です。','This challenge condition was missed. A regular clear is still possible.'):
   ban&&!Number.isInteger(s.used)?tr('旧版からの中断データです。この札を狙うには今夜をやり直してください。','This shift was started in an older version. Restart the night to attempt this stamp.'):'';
 const cards=`<div class="stamp-grid">${stampCard(index,1)+stampCard(index,2)}</div>${status?`<p>${status}</p>`:''}`;
 return expanded?cards:`<details class="night-stamps"><summary>${tr('今夜のおもてなし札','Tonight’s stamps')} · ${Number(Boolean(stamps[index]&1))+Number(Boolean(stamps[index]&2))}/2</summary>${cards}</details>`;
}
function closeNight(){
 const won=awards(s,n(),index);
 earned=won&~stamps[index];stamps[index]|=won;
 recorded=true;best[index]=Math.max(best[index],s.served);view='result';
}
function result(){
 const clear=s.served>=n()[5], mainEnd=clear&&index===11, final=clear&&index===nights.length-1;
 return `<section class="panel result"><div class="stamp">${clear?'♨':'☾'}</div><h1>${final?tr('瓶牛乳で乾杯','A Milk-Bottle Toast'):mainEnd?tr('最後の灯がともる','The last lantern glows'):clear?tr('いい湯でした','A good soak'):tr('閉店です','Closing time')}</h1><p>${tr('満足して帰った妖怪','Happy guests')}: ${s.served} / ${n()[2].length} · ${tr('目標','Goal')} ${n()[5]}</p><p class="scene">${final?tr('河童と一つ目小僧は瓶を合わせた。「また一緒に来ようね」','Kappa and the Kid clink their bottles. “Let’s come back together.”'):mainEnd?tr('湯上がりの瓶牛乳が、空の棚に並ぶ。小僧と河童が手を振った。また明日、同じ暖簾の下で。','Empty milk bottles line the shelf. The Kid and Kappa wave goodbye. See you tomorrow, under the same curtain.'):clear?tr('湯上がりの瓶牛乳が、今夜も売り切れた。','The last bottle of post-bath milk is gone.'):tr('客順を見て、湯船の空席を先に作ってみよう。','Look ahead in the queue and try leaving a seat free.')}</p>${final?toastArt():''}<div class="row">${clear&&!final?`<button class="primary" data-level="${index+1}">${mainEnd?tr('裏営業へ','Open After Hours'):tr('次の晩','Next night')} →</button>`:''}<button data-level="${index}">${tr('もう一度','Play again')}</button><button data-nav="menu">${tr('営業日一覧','Night list')}</button></div></section>`;
}
function render(){
 companionObserver?.disconnect();companionObserver=null;
 const mobile=view==='play'&&compact.matches;
 const oldGuide=app.querySelector('.guide');
 const oldAlbum=app.querySelector('.stamp-album');
 if(oldAlbum)albumOpen=oldAlbum.open;
 const nightStampsOpen=app.querySelector('.night-stamps')?.open;
 const queueOpen=app.querySelector('.queue-panel')?.open;
 const steam=[...app.querySelectorAll('.bath .vapor')].map(el=>[el.closest('.bath').id,[...el.children].map(p=>p.getAnimations?.()[0]?.currentTime)]);
 if(oldGuide)guideOpen=oldGuide.open;
 document.documentElement.lang=lang?'en':'ja';document.title=title();
 app.classList.toggle('compact-app',mobile);
 app.innerHTML=(mobile?'':top())+(view==='menu'?menu():view==='play'?(mobile?compactPlay():play()):result())+(!mobile&&(saveFailed||conflict)?`<p role="status">${saveFailed?tr('このブラウザでは進行を保存できません。','This browser could not save your progress.'):tr('別のタブの中断データを保持しています。最新の営業を再開するには、この画面を再読み込みしてください。','Another tab owns the saved shift. Reload this page to resume that shift.')}</p>`:'');
 arrival=null;
 const companion=app.querySelector('.companion-space');
 if(companion){
   const grid=companion.firstElementChild;
   const fit=()=>{
     grid.removeAttribute('data-small');
     grid.removeAttribute('data-summary');
     if(grid.offsetHeight>companion.clientHeight)grid.dataset.small='true';
     if(grid.offsetHeight>companion.clientHeight)grid.dataset.summary='true';
     if(grid.offsetHeight>companion.clientHeight)grid.dataset.summary='temperature';
     companion.dataset.fit=String(grid.offsetHeight>0&&grid.offsetHeight<=companion.clientHeight);
   };
   fit();
   if(typeof ResizeObserver==='function'){
     companionObserver=new ResizeObserver(fit);
     companionObserver.observe(companion);companionObserver.observe(grid);
   }
 }
 for(const [id,times] of steam){
   const next=app.querySelector('#'+id+' .vapor');
   if(next?.childElementCount===times.length){
     // Keep the animation phase even when the view is redrawn.
     [...next.children].forEach((p,i)=>{const a=p.getAnimations?.()[0];if(a&&times[i]!=null)a.currentTime=times[i]});
   }
 }
 const newGuide=app.querySelector('details:not(.queue-panel)');
 newGuide?.classList.add('guide');
 if(view==='menu')app.querySelector('.hero').insertAdjacentHTML('afterend',stampPanel());
 if(view==='play'&&!mobile){
   app.querySelector('.hint-tools').insertAdjacentHTML('afterend',stampPanel());
   if(nightStampsOpen)app.querySelector('.night-stamps').open=true;
   if(s.served>=n()[5])app.querySelector('.baths + .row').insertAdjacentHTML('afterbegin',`<button class="primary" data-nav="close">${tr('目標達成・閉店する','Goal met · Close now')}</button>`);
 }
 const dialog=app.querySelector('.play-sheet');
 if(dialog){
   dialog.addEventListener('cancel',e=>{e.preventDefault();dismissSheet()});
   dialog.showModal();
 }
 if(view==='result'){
   const row=app.querySelector('.result .row');
   row.insertAdjacentHTML('afterend',stampPanel());
   const status=document.createElement('p');
   status.textContent=!previousTurn?tr('クリア！ 記録を保存しました。','Cleared! Your record was saved.'):s.served>=n()[5]
     ?tr('クリア！ 1手戻しても、最高記録と晩の解放は残ります。最後の手を戻せるのはこの画面を離れるまでです。','Cleared! Undo keeps your best score and unlocked nights. You can undo until you leave this screen.')
     :tr('目標未達。この画面を離れる前なら最後の手を戻せます。今夜を最初からやり直すこともできます。','Goal missed. You can undo before leaving this screen, or replay the whole night.');
   row.before(status);
   if(previousTurn)row.insertAdjacentHTML('beforeend',undoButton());
 }
 if(queueOpen&&app.querySelector('.queue-panel'))app.querySelector('.queue-panel').open=true;
 if(newGuide){
   newGuide.open=guideOpen;
   const p=document.createElement('p');
   p.textContent=tr('表示の湯温は3段階です。設定を1段変えても、妖怪の効果で「熱湯」や「ぬる湯」のままになることがあります。「1手戻す」は直前の操作だけを取り消します。','The displayed temperature has three levels. Changing the setting may leave the bath Hot or Cool because of the bathers’ effects. Undo reverses only the most recent turn.');
   newGuide.querySelector('ul').before(p);
 }
 if(view==='result'&&index===1&&s.served>=n()[5]){
  const p=document.createElement('p');p.className='scene';
  p.textContent=tr('瓶牛乳を手にした一つ目小僧が河童を誘った。「次も一緒に来てくれる？」','The One-eyed Kid turns to Kappa, milk bottle in hand. “Will you come with me next time?”');
  app.querySelector('.result .row').before(p);
 }
}
function focusHeading(){const h=app.querySelector('h1,h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true})}}
function resetCompact(){activeBath=0;sheet=null;turnReport=null}
function dismissSheet(){const old=sheet;sheet=null;render();app.querySelector(`[data-sheet="${old}"]`)?.focus({preventScroll:true})}
async function begin(i){if(!nights[i]||!unlocked(i))return;index=i;s=start(n());suspended=null;previousTurn=null;message=null;hintOpen=false;hintResult=null;recorded=false;view='play';resetCompact();await save(true);render();window.scrollTo(0,0);focusHeading()}
let busy=false;
app.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(busy)return;
 busy=true;
 try{
 if(b.dataset.level!==undefined){
   const i=Number(b.dataset.level);
   if(suspended&&!confirm(tr('中断中の営業を上書きしますか？','Replace your suspended shift?')))return;
   await begin(i);return;
 }
 const nav=b.dataset.nav;
 if(nav==='hint-show'&&sheet==='hint'&&hintResult?.status==='move'){
   const [type,i]=hintResult.action;
   activeBath=i;sheet=type==='seat'?null:'adjust';render();
   if(!sheet)app.querySelector(`[data-bath="${i}"]`)?.focus({preventScroll:true});
   return;
 }
 if(b.dataset.bath!==undefined||b.dataset.companion!==undefined){
   activeBath=Number(b.dataset.bath??b.dataset.companion);render();app.querySelector(`[data-bath="${activeBath}"]`)?.focus({preventScroll:true});return;
 }
 if(b.dataset.sheet){sheet=b.dataset.sheet;render();return}
 if(nav==='sheet-close'){dismissSheet();return}
 if(nav==='close'&&view==='play'&&s.served>=n()[5]){
   previousTurn=null;closeNight();await save();render();window.scrollTo(0,0);focusHeading();return;
 }
 if(nav==='undo'&&previousTurn){
   const wasResult=view==='result';
   s=previousTurn;previousTurn=null;recorded=false;view='play';hintResult=null;arrival=null;sheet=null;turnReport=null;
   message=['直前の1手を戻しました。次の手を打つと、またその手を戻せます。','Last turn undone. Make a move before you can undo again.'];
   await save(true);render();
   if(wasResult)window.scrollTo(0,0);
   const target=app.querySelector('.overview,.compact-overview');
   target.tabIndex=-1;target.focus({preventScroll:!compact.matches});
   document.querySelector('#announce').textContent=message[lang];
   return;
 }
 if(nav==='hint'||nav==='hint-move'){
   if(nav==='hint'){hintOpen=!hintOpen;if(!hintOpen)hintResult=null}
   else hintResult=Bath.hint(s,n());
   render();app.querySelector('[data-nav="hint"]')?.focus({preventScroll:true});
   if(sheet==='hint')app.querySelector('[data-hint-answer]')?.focus({preventScroll:true});
   document.querySelector('#announce').textContent=hintOpen?hintText():'';return;
 }
 if(nav==='language'){lang=1-lang;try{localStorage.setItem(key+'-lang',lang?'en':'ja')}catch{}render();app.querySelector('[data-nav="language"]').focus();return}
 if(nav==='menu'){if(view==='play'){suspended={index,s,previousTurn};view='menu';await save()}else view='menu';render();window.scrollTo(0,0);focusHeading();return}
 if(nav==='resume'&&suspended){({index,s}=suspended);const p=suspended.previousTurn;previousTurn=validShift({index,s:p})&&p.turn===s.turn-1?p:null;suspended=null;recorded=false;message=null;view='play';resetCompact();await save();render();window.scrollTo(0,0);focusHeading();return}
 if(nav==='retry'){if(!s.turn||confirm(tr('今夜の進行をやり直しますか？','Restart this night?')))await begin(index);return}
 if(!b.dataset.action||view!=='play')return;
 const a=b.dataset.action.split(',').map((v,i)=>i?Number(v):v);
 const prev=s,report={};s=step(s,n(),a,report);if(prev===s)return;
 const wasSheet=sheet;sheet=null;
 turnReport=report.departures;
 if(a[0]==='move'&&compact.matches)activeBath=a[3];
 previousTurn=prev;
 if(a[0]==='seat')arrival=[a[1],s.baths[a[1]].people.length-1];
 hintResult=null;
 const notices=[];
 if(s.served>prev.served)notices.push(['満足して帰った妖怪：'+(s.served-prev.served),'Happy guests served: '+(s.served-prev.served)]);
 if(s.lost>prev.lost)notices.push(['河童の皿が乾き、帰ってしまった。','Kappa’s plate dried out. He went home.']);
 if(s.lost>n()[2].length-n()[5])notices.push(['残り全員を満足させても目標には届きません。「1手戻す」か「今夜をやり直す」を選べます。','The goal is now out of reach. Try undoing the last turn, or restart the night.']);
 message=notices.length?[0,1].map(i=>notices.map(x=>x[i]).join(' ')):null;
 if(done(s,n())&&!recorded){closeNight();window.scrollTo(0,0)}
 await save();render();
 document.querySelector('#announce').textContent=message?message[lang]:'';
 if(view==='result'){focusHeading();return}
 if(compact.matches){
   const next=wasSheet?app.querySelector('[data-sheet="adjust"]'):[...app.querySelectorAll('button[data-action]')].find(x=>x.dataset.action===b.dataset.action);
   (next||app.querySelector('.compact-overview'))?.focus({preventScroll:true});return;
 }
 const exact=a[0]!=='move'&&[...app.querySelectorAll('button[data-action]')].find(x=>x.dataset.action===b.dataset.action);
 const bath=a[0]==='wait'?null:app.querySelector('#bath-'+a[1]);
 const focus=exact||bath?.querySelector('.actions button')||bath?.querySelector('h3')||app.querySelector('button[data-action="wait"]');
 if(focus){
   if(focus.tagName==='H3')focus.tabIndex=-1;
   focus.focus({preventScroll:true});
   const top=app.querySelector('.overview')?.getBoundingClientRect().bottom??0, rect=focus.getBoundingClientRect();
   if(rect.top<top||rect.bottom>innerHeight)focus.scrollIntoView({block:'center'});
 }
 }finally{busy=false}
});
compact.addEventListener('change',()=>{if(view==='play'&&!busy){sheet=null;render();focusHeading()}});
render();
})();
