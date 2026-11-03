(() => {
const {guests,nights,temp,start,step,actions,done}=Bath;
const app=document.querySelector('#app');
const key='yokai-bathhouse-v1';
function read(){try{return JSON.parse(localStorage.getItem(key))||{}}catch{return {}}}
const data=read();
function readLanguage(){try{return localStorage.getItem(key+'-lang')??data.lang}catch{return data.lang}}
const score=(d,i)=>Number.isInteger(d.best?.[i])&&d.best[i]>=0&&d.best[i]<=nights[i][2].length?d.best[i]:0;
let lang=readLanguage()==='en'?1:0, best=nights.map((_,i)=>score(data,i));
let index=0,s=null,view='menu',message=null,recorded=false,saveFailed=false,guideOpen=false;
let hintOpen=false,hintResult=null;
let arrival=null;
let previousTurn=null;
const tr=(ja,en)=>lang?en:ja;
const name=id=>guests[id][lang];
const temperature=t=>[tr('❄ ぬる湯','❄ Cool'),'≈ '+tr('適温','Warm'),tr('♨ 熱湯','♨ Hot')][t+1];
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
   const owns=(latest.revision??null)===revision||(allowEmpty&&!latest.shift);
   conflict=!owns;
   const nextRevision=owns?String(Date.now())+'-'+Math.random():latest.revision;
   localStorage.setItem(key,JSON.stringify({best,revision:nextRevision,shift:owns?shift:latest.shift}));
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
function menu(){return `<section class="hero">${art}<div class="eyebrow">${tr('終電のあと、暖簾が開く','AFTER THE LAST TRAIN')}</div><h1>${title()}</h1><p>${tr('雪女で冷まし、火車で温める。今夜も、妖怪たちにいい湯を。','Cool the water with a snow spirit. Warm it with a fire cat. Give every yokai a good soak.')}</p><div class="row">${suspended?`<button class="primary" data-nav="resume">${tr('営業を再開','Resume shift')}</button>`:`<button class="primary" data-level="${Math.max(0,nights.findIndex((x,i)=>best[i]<x[5]))}">${tr('暖簾を開ける','Open the bathhouse')}</button>`}</div></section><section class="panel"><h2>${tr('十二晩の営業','Twelve nights')}</h2><div class="levels">${nights.map((x,i)=>`<button data-level="${i}" ${unlocked(i)?'':'disabled'}>${String(i+1).padStart(2,'0')} · ${x[lang]}<br><small>${unlocked(i)?`${tr('最高','Best')} ${best[i]}/${x[2].length}`:'🔒'}</small></button>`).join('')}</div></section>${guide()}`}
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
 if(p.id==='H'&&b.people.length<2)return tr('相席待ち','Needs company');
 return p.streak?tr('✓ 快適','✓ Comfy'):tr('次の手から快適','Comfy next turn');
}
function action(a,label,cls='',id='',accessible=''){return `<button class="${cls}" data-action="${a.join(',')}" ${id?`aria-describedby="${id}"`:''} ${accessible?`aria-label="${accessible}"`:''}>${label}</button>`}
function hintText(){
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
 if(type==='move')return tr(`湯船${i+1}の${name(s.baths[i].people[k].id)}を湯船${j+1}へ移しましょう。`,`Move ${name(s.baths[i].people[k].id)} from Bath ${i+1} to Bath ${j+1}.`);
 return tr('誰も移動させず、１手待ちましょう。','Wait one turn without moving anyone.');
}
function play(){
 const legal=actions(s,n()), head=s.queue[0];
 return `<section class="panel"><div class="eyebrow">${tr('第','NIGHT ')}${index+1}${tr('晩','')} / 12</div><h2>${n()[lang]}</h2><p class="scene">${stories[index][lang]}</p><div class="stats"><span>${tr('残り','Turns left')} ${n()[4]-s.turn}</span><span>${tr('満足','Happy')} ${s.served}/${n()[5]}</span><span>${tr('帰った','Walked out')} ${s.lost}</span></div></section>
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
 return `<section id="bath-${i}" class="bath ${temp(b)<0?'cold':temp(b)>0?'hot':''}"><h3>${tr('湯船','Bath')} ${i+1} · ${temperature(temp(b))}</h3><small>${tr('設定','Setting')}: ${temperature(b.base)} · ${b.people.length}/3 ${n()[6]?.lock===i?tr(' · 釜故障',' · boiler out'):''}</small>
 ${bathScene(b,i)}
 <ul class="people">${b.people.map((p,k)=>`<li>${guestLabel(p.id)} · ${temperature(guests[p.id][4])} · ${p.streak}/2 · ${comfort(p,b)}${legal.filter(a=>a[0]==='move'&&a[1]===i&&a[2]===k).map(a=>` <span class="move">${action(a,tr('→ 湯船','→ Bath')+' '+(a[3]+1),'','',tr(`${name(p.id)}を湯船${a[3]+1}へ移す`,`Move ${name(p.id)} to Bath ${a[3]+1}`))}</span>`).join('')}</li>`).join('')||`<li class="muted">${tr('空席','Empty')}</li>`}</ul>
 <div class="preview" id="preview-${i}">${preview===null?'':name(head.id)+' · '+tr('好み：','Wants ')+temperature(guests[head.id][4])+'<br>'+tr('この手の判定：','This turn: ')+temperature(preview)+(after!==preview?tr(' ／ 退浴後：',' / After guests leave: ')+temperature(after):'')}</div><div class="actions">${canSeat?action(canSeat,tr('案内する','Seat guest'),'primary','preview-'+i,tr(`${name(head.id)}を湯船${i+1}に案内`,`Seat ${name(head.id)} in Bath ${i+1}`)):''}${legal.filter(a=>a[0]==='heat'&&a[1]===i).map(a=>action(a,a[2]>0?tr('＋ 温める','+ Heat'):tr('− 冷ます','− Cool'),'','',tr(`湯船${i+1}を${a[2]>0?'温める':'冷ます'}`,`${a[2]>0?'Heat':'Cool'} Bath ${i+1}`))).join('')}</div></section>`;
 }).join('')}</div><div class="row">${action(['wait'],tr('１手待つ','Wait a turn'))}<button data-nav="retry">${tr('今夜をやり直す','Restart night')}</button></div>
 ${guide()}`;
}
function undoButton(){return `<button data-nav="undo" ${previousTurn?'':'disabled'}>${tr('↶ 1手戻す','↶ Undo last turn')}</button>`}
function result(){
 const clear=s.served>=n()[5], final=clear&&index===11;
 return `<section class="panel result"><div class="stamp">${clear?'♨':'☾'}</div><h1>${final?tr('最後の灯がともる','The last lantern glows'):clear?tr('いい湯でした','A good soak'):tr('閉店です','Closing time')}</h1><p>${tr('満足して帰った妖怪','Happy guests')}: ${s.served} / ${n()[2].length} · ${tr('目標','Goal')} ${n()[5]}</p><p class="scene">${final?tr('湯上がりの瓶牛乳が、空の棚に並ぶ。小僧と河童が手を振った。また明日、同じ暖簾の下で。','Empty milk bottles line the shelf. The Kid and Kappa wave goodbye. See you tomorrow, under the same curtain.'):clear?tr('湯上がりの瓶牛乳が、今夜も売り切れた。','The last bottle of post-bath milk is gone.'):tr('客順を見て、湯船の空席を先に作ってみよう。','Look ahead in the queue and try leaving a seat free.')}</p><div class="row">${clear&&!final?`<button class="primary" data-level="${index+1}">${tr('次の晩','Next night')} →</button>`:''}<button data-level="${index}">${tr('もう一度','Play again')}</button><button data-nav="menu">${tr('営業日一覧','Night list')}</button></div></section>`;
}
function render(){
 const oldGuide=app.querySelector('details:not(.queue-panel)');
 const queueOpen=app.querySelector('.queue-panel')?.open;
 const steam=[...app.querySelectorAll('.bath .vapor')].map(el=>[el.closest('.bath').id,[...el.children].map(p=>p.getAnimations?.()[0]?.currentTime)]);
 if(oldGuide)guideOpen=oldGuide.open;
 document.documentElement.lang=lang?'en':'ja';document.title=title();
 app.innerHTML=top()+(view==='menu'?menu():view==='play'?play():result())+(saveFailed||conflict?`<p role="status">${saveFailed?tr('このブラウザでは進行を保存できません。','This browser could not save your progress.'):tr('別のタブの中断データを保持しています。最新の営業を再開するには、この画面を再読み込みしてください。','Another tab owns the saved shift. Reload this page to resume that shift.')}</p>`:'');
 arrival=null;
 for(const [id,times] of steam){
   const next=app.querySelector('#'+id+' .vapor');
   if(next?.childElementCount===times.length){
     // Keep the animation phase even when the view is redrawn.
     [...next.children].forEach((p,i)=>{const a=p.getAnimations?.()[0];if(a&&times[i]!=null)a.currentTime=times[i]});
   }
 }
 const newGuide=app.querySelector('details:not(.queue-panel)');
 if(view==='result'){
   const row=app.querySelector('.result .row');
   const status=document.createElement('p');
   status.textContent=s.served>=n()[5]
     ?tr('クリア！ 1手戻しても、最高記録と晩の解放は残ります。最後の手を戻せるのはこの画面を離れるまでです。','Cleared! Undo keeps your best score and unlocked nights. You can undo until you leave this screen.')
     :tr('目標未達。この画面を離れる前なら最後の手を戻せます。今夜を最初からやり直すこともできます。','Goal missed. You can undo before leaving this screen, or replay the whole night.');
   row.before(status);
   row.insertAdjacentHTML('beforeend',undoButton());
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
async function begin(i){if(!nights[i]||!unlocked(i))return;index=i;s=start(n());suspended=null;previousTurn=null;message=null;hintOpen=false;hintResult=null;recorded=false;view='play';await save(true);render();window.scrollTo(0,0);focusHeading()}
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
 if(nav==='undo'&&previousTurn){
   const wasResult=view==='result';
   s=previousTurn;previousTurn=null;recorded=false;view='play';hintResult=null;arrival=null;
   message=['直前の1手を戻しました。次の手を打つと、またその手を戻せます。','Last turn undone. Make a move before you can undo again.'];
   await save(true);render();
   if(wasResult)window.scrollTo(0,0);
   const target=app.querySelector('.overview');
   target.tabIndex=-1;target.focus({preventScroll:true});
   document.querySelector('#announce').textContent=message[lang];
   return;
 }
 if(nav==='hint'||nav==='hint-move'){
   if(nav==='hint'){hintOpen=!hintOpen;if(!hintOpen)hintResult=null}
   else hintResult=Bath.hint(s,n());
   render();app.querySelector('[data-nav="hint"]').focus({preventScroll:true});
   document.querySelector('#announce').textContent=hintOpen?hintText():'';return;
 }
 if(nav==='language'){lang=1-lang;try{localStorage.setItem(key+'-lang',lang?'en':'ja')}catch{}render();app.querySelector('[data-nav="language"]').focus();return}
 if(nav==='menu'){if(view==='play'){suspended={index,s,previousTurn};view='menu';await save()}else view='menu';render();window.scrollTo(0,0);focusHeading();return}
 if(nav==='resume'&&suspended){({index,s}=suspended);const p=suspended.previousTurn;previousTurn=validShift({index,s:p})&&p.turn===s.turn-1?p:null;suspended=null;recorded=false;message=null;view='play';await save();render();window.scrollTo(0,0);focusHeading();return}
 if(nav==='retry'){if(!s.turn||confirm(tr('今夜の進行をやり直しますか？','Restart this night?')))await begin(index);return}
 if(!b.dataset.action||view!=='play')return;
 const a=b.dataset.action.split(',').map((v,i)=>i?Number(v):v);
 const prev=s;s=step(s,n(),a);if(prev===s)return;
 previousTurn=prev;
 if(a[0]==='seat')arrival=[a[1],s.baths[a[1]].people.length-1];
 hintResult=null;
 const notices=[];
 if(s.served>prev.served)notices.push(['満足して帰った妖怪：'+(s.served-prev.served),'Happy guests served: '+(s.served-prev.served)]);
 if(s.lost>prev.lost)notices.push(['河童の皿が乾き、帰ってしまった。','Kappa’s plate dried out. He went home.']);
 if(s.lost>n()[2].length-n()[5])notices.push(['残り全員を満足させても目標には届きません。「1手戻す」か「今夜をやり直す」を選べます。','The goal is now out of reach. Try undoing the last turn, or restart the night.']);
 message=notices.length?[0,1].map(i=>notices.map(x=>x[i]).join(' ')):null;
 if(done(s,n())&&!recorded){recorded=true;best[index]=Math.max(best[index],s.served);view='result';window.scrollTo(0,0)}
 await save();render();
 document.querySelector('#announce').textContent=message?message[lang]:'';
 if(view==='result'){focusHeading();return}
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
render();
})();
