/* خطتي لحفظ القرآن الكريم: المحرّك */
(function(){
"use strict";
const PAGE_W=128;
const WD_NAMES=["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const WEEK_ORDER=[6,0,1,2,3,4,5];
const WC=new Uint16Array(TOTAL),PW=new Uint32Array(TOTAL+1);
(function(){let acc=0;for(let g=0;g<TOTAL;g++){const f=fromGi(g);WC[g]=ayahText(f.s,f.a).split(/\s+/).filter(Boolean).length;acc+=WC[g];PW[g+1]=acc;}})();
const PAGE_G=MSH_PAGES.map(x=>gi(x[0],x[1]));
function pageOfGi(g){let lo=0,hi=603;while(lo<hi){const m=(lo+hi+1)>>1;if(PAGE_G[m]<=g)lo=m;else hi=m-1;}return lo+1;}
const wordsOf=(a,b)=>PW[b+1]-PW[a];
const pagesOf=w=>Math.round(w/PAGE_W*10)/10;
const wdOf=k=>new Date(k+"T00:00:00Z").getUTCDay();
function labG(g0,g1){const A=fromGi(g0),B=fromGi(g1);if(A.s===B.s)return rangeLabel(A.s,A.a,B.a);return "من "+SN[A.s-1]+" ("+n(A.a)+") إلى "+SN[B.s-1]+" ("+n(B.a)+")";}
function labR(r){return r.map(x=>labG(x[0],x[1])).join(" ، ");}
const LV={b:{name:"مبتدئ",nw:.45,rv:.045,listen:15},m:{name:"متوسط",nw:.30,rv:.035,listen:10},a:{name:"متقدم",nw:.20,rv:.028,listen:5}};
const UNITS=[["ayat","آيات"],["half","نصف صفحة"],["page","صفحة"],["pages2","صفحتان"],["juz","جزء"],["pagesx","مقدار مخصص"]];
const MODELS={
 sab:{n:"الجديد والقريب والبعيد (السبق والسبقي والمنزل)",s:"حفظ جديد يوميًا، مراجعة قريبة يومية لآخر أسبوع، ثم دورة ثابتة للمحفوظ القديم.",rev:-1},
 srs:{n:"المراجعة المتباعدة التكيفية",s:"كل مقطع يعود إليك على فترات تتباعد كلما أتقنتِه وتقصر إذا أخطأتِ.",rev:-1},
 cum:{n:"المراجعة التراكمية مع يوم مراجعة أسبوعي",s:"مراجعة تراكمية للسورة التي تحفظينها كل يوم، ويوم كامل في الأسبوع للمراجعة فقط.",rev:5}
};
const METHODS_MEM={seq:"التسلسلي (آية بآية مع الربط)",jam:"التجميعي",mq:"المقسَّم (مقاطع بالمعنى)",trad:"التقليدي (الورد كاملًا)"};
const REVIEW_NAMES={near:"المراجعة القريبة",mid:"المراجعة المتوسطة",far:"المراجعة البعيدة",weak:"آيات تحتاج تثبيتًا",cum:"المراجعة التراكمية للسورة",new:"الحفظ الجديد",new2:"تثبيت الجديد قبل النوم"};
/* ---- حالة الخطة ---- */
const caches=new WeakMap();
function PL(){return ST.plan||null;}
function bump(p){p.ver=(p.ver||0)+1;caches.delete(p);}
function memArr(p){
  let c=caches.get(p);if(c&&c.ver===p.ver&&c.mem)return c.mem;
  const mem=new Uint8Array(TOTAL);
  (p.cfg.skip||[]).forEach(r=>{for(let g=r[0];g<=r[1];g++)mem[g]=2;});
  p.units.forEach(u=>{for(let g=u.a;g<=u.b;g++)mem[g]=1;});
  caches.set(p,{ver:p.ver,mem});return mem;
}
function orderSurahs(c){const a=[],st=c.startS||1;
  if(c.dir==="back"){for(let s=st;s>=1;s--)a.push(s);for(let s=114;s>st;s--)a.push(s);}
  else{for(let s=st;s<=114;s++)a.push(s);for(let s=1;s<st;s++)a.push(s);}
  return a;}
function targetWords(c){switch(c.unit){case"half":return PAGE_W/2;case"page":return PAGE_W;case"pages2":return PAGE_W*2;case"pagesx":return Math.max(10,Math.round((c.val||1)*PAGE_W));case"juz":return PAGE_W*20;default:return 0;}}
function juzIdxOf(g){let i=0;while(i<29&&JUZ_GI[i+1]<=g)i++;return i;}
function takePortion(c,g,sEnd,mem,scale){
  scale=scale||1;let e=g;
  if(c.unit==="ayat"){const k=Math.max(1,Math.round((c.val||5)*scale));e=Math.min(sEnd,g+k-1);const rest=sEnd-e;if(rest>0&&rest<=Math.floor(k/2))e=sEnd;
    while(e>g&&mem[e])e--;}
  else if(c.unit==="juz"&&scale===1){const ji=juzIdxOf(g),end=ji<29?JUZ_GI[ji+1]-1:TOTAL-1;e=g;while(e<end&&!mem[e+1]&&(c.dir!=="back"||e<sEnd))e++;}
  else{
    const W=(c.unit==="juz"?PAGE_W*20:targetWords(c))*scale;let acc=0;e=g-1;
    while(e+1<TOTAL&&!mem[e+1]){const w=WC[e+1];if(acc>0&&acc+w/2>W)break;acc+=w;e++;if(acc>=W)break;if((W<=PAGE_W*1.1||c.dir==="back")&&e>=sEnd)break;}
    if(e<g)e=g;
    if(W>=PAGE_W*.9){const pg=pageOfGi(e),pe=pg<604?PAGE_G[pg]-1:TOTAL-1;if(pe>e&&wordsOf(e+1,pe)<=22){let ok=true;for(let x=e+1;x<=pe;x++)if(mem[x]){ok=false;break;}if(ok&&(c.dir!=="back"||pe<=sEnd))e=pe;}}
  }
  return{g0:g,g1:e,w:wordsOf(g,e)};
}
function nextPortion(p,scale){
  const c=p.cfg,mem=memArr(p);
  for(const s of orderSurahs(c)){const g0=OFF[s-1],g1=g0+SC[s-1]-1;let g=g0;while(g<=g1&&mem[g])g++;if(g>g1)continue;return takePortion(c,g,g1,mem,scale);}
  return null;
}
function remainingWords(p){const mem=memArr(p);let w=0;for(let g=0;g<TOTAL;g++)if(!mem[g])w+=WC[g];return w;}
function remainingAyat(p){const mem=memArr(p);let k=0;for(let g=0;g<TOTAL;g++)if(!mem[g])k++;return k;}
function memWords(p){let w=0;p.units.forEach(u=>{w+=wordsOf(u.a,u.b);});return w;}
function cycleDays(p){const pg=memWords(p)/PAGE_W;return pg<=20?7:pg<=60?10:pg<=140?15:pg<=300?22:30;}
function ladderOf(p){const m=p.cfg.model;if(m==="srs")return[1,2,4,7,14,30,60,90];if(m==="cum")return[1,1,2,4,7,10,14,21,30];return[1,1,1,1,1,1,1,cycleDays(p)];}
/* ---- تقدير المدة ---- */
function avgNewWords(p){const c=p.cfg;if(c.unit==="ayat"){const mem=memArr(p);let g=0,k=0,w=0;for(let i=0;i<TOTAL;i++)if(!mem[i]){w+=WC[i];k++;}return k?Math.max(8,w/k*(c.val||5)):40;}return Math.max(20,targetWords(c));}
function projectFinish(p,from){
  const c=p.cfg,rem=remainingWords(p);if(rem<=0)return{days:0,date:from||todayKey(),newDays:0};
  const per=avgNewWords(p),newDays=Math.ceil(rem/per);
  let k=0,d=from||todayKey(),used=0;
  const days=c.days&&c.days.length?c.days:[6,0,1,2,3];
  for(let i=0;i<5000&&used<newDays;i++){const wd=wdOf(d);if(days.includes(wd)&&wd!==c.revDay)used++;if(used<newDays)d=addDays(d,1);k++;}
  return{days:diffDays(from||todayKey(),d),date:d,newDays};
}
/* ---- الفترات ---- */
function levelOf(u,date){const age=diffDays(u.d,date);return age<=7?"near":age<=60?"mid":"far";}
function recentScores(p,date,k){const out=[];for(let i=1;i<=k;i++){const L=p.log[addDays(date,-i)];if(L&&L.t)for(const key in L.t){const t=L.t[key];if(t.score!=null&&t.type!=="new2")out.push(t.score);}if(L&&L.new&&L.new.score!=null)out.push(L.new.score);}return out;}
function dueUnits(p,date){return p.units.filter(u=>u.nx<=date);}
function mergeUnits(list,lv,type){
  const s=list.slice().sort((a,b)=>a.a-b.a),groups=[];
  s.forEach(u=>{const g=groups[groups.length-1];if(g&&g.b+1===u.a&&wordsOf(g.a,u.b)<=PAGE_W*2){g.b=u.b;g.units.push(u.i);}else groups.push({a:u.a,b:u.b,units:[u.i]});});
  return groups.map(g=>{const w=wordsOf(g.a,g.b);return{key:type+"_"+g.a+"_"+g.b,type,r:[[g.a,g.b]],w,min:Math.max(1,Math.round(w*lv.rv)),units:g.units};});
}
function dayStats(tasks){let w=0,ay=0,mn=0;tasks.forEach(t=>{w+=t.w;mn+=t.min;t.r.forEach(r=>{ay+=r[1]-r[0]+1;});});return{w,ay,pg:pagesOf(w),min:mn};}
/* ---- بناء اليوم ---- */
function computeMode(p,date,o){
  const c=p.cfg,lv=LV[c.level],wd=wdOf(date);
  let scale=1,reason="",mode="study";
  const sc=recentScores(p,date,7);const avg=sc.length>=3?sc.reduce((a,b)=>a+b,0)/sc.length:null;
  let np=nextPortion(p,1);
  if(!np)return{mode:"revonly",reason:"أتممتِ كل ما في خطتك، والآن يبقى تثبيت المحفوظ بالمراجعة.",scale:1,newR:null};
  if(!(c.days||[]).includes(wd))return{mode:"revonly",reason:"ليس من أيام الحفظ الجديد في جدولك. اليوم للمراجعة.",scale:1,newR:null};
  if(c.revDay>=0&&c.revDay===wd)return{mode:"revonly",reason:"يوم المراجعة الأسبوعي، بدون حفظ جديد.",scale:1,newR:null};
  const due=dueUnits(p,date);let dw=0;due.forEach(u=>{dw+=wordsOf(u.a,u.b);});
  const budW=(c.mins*.6)/lv.rv;
  if(dw>budW*2.5)return{mode:"revonly",reason:"تراكمت مراجعات ("+n(Math.round(dw/PAGE_W))+" صفحة تقريبًا). اليوم لتصفيتها قبل إضافة جديد.",scale:1,newR:null};
  if(avg!=null&&avg<55)return{mode:"revonly",reason:"نتائج آخر أيامك تحتاج تثبيتًا. اليوم مراجعة فقط حتى يتحسن الإتقان.",scale:1,newR:null};
  if(avg!=null&&avg<72){scale=.5;reason="خفّفنا الحفظ الجديد إلى النصف مؤقتًا لأن نتائج آخر أيامك تحتاج تثبيتًا، وزادت المراجعة.";np=nextPortion(p,.5)||np;}
  if(c.unit==="juz"&&scale!==1){np=nextPortion(p,scale)||np;}
  return{mode:"study",reason,scale,newR:[np.g0,np.g1]};
}
function ensureDay(p,date,o){
  o=o||{};let L=p.log[date];
  if(L&&L.mode)return L;
  const m=computeMode(p,date,o);
  if(o.sim)return Object.assign({t:{}},m);
  L=p.log[date]=Object.assign(L||{},{t:L&&L.t||{}},m);
  return L;
}
function buildDay(p,date,o){
  o=o||{};const c=p.cfg,lv=LV[c.level],lad=ladderOf(p);
  const day={date,mode:"study",reason:"",tasks:[],done:[],paused:false};
  if(p.st==="paused"&&!o.sim){day.paused=true;day.mode="paused";return day;}
  const L=ensureDay(p,date,o);
  day.mode=L.mode;day.reason=L.reason||"";day.scale=L.scale;
  const doneT=L.t||{};
  Object.keys(doneT).forEach(k=>day.done.push(Object.assign({key:k},doneT[k])));
  let doneRevMin=0;day.done.forEach(t=>{if(["near","mid","far","weak","cum"].includes(t.type))doneRevMin+=t.min||0;});
  const tasks=[];
  let newMin=0;
  if(L.mode==="study"&&L.newR){
    const w=wordsOf(L.newR[0],L.newR[1]);newMin=Math.round(w*lv.nw);
    const nd=L.new&&L.new.done;
    if(!nd)tasks.push({key:"new",type:"new",r:[[L.newR[0],L.newR[1]]],w,min:newMin,units:[]});
    else{const nr=L.new.r||L.newR;
      if(!doneT.new2)tasks.push({key:"new2",type:"new2",r:[[nr[0],nr[1]]],w:wordsOf(nr[0],nr[1]),min:Math.max(2,Math.round(wordsOf(nr[0],nr[1])*lv.rv)),units:[]});}
  }
  let budget=L.mode==="study"?Math.max(c.mins*.4,c.mins-newMin):c.mins;
  budget=Math.max(5,budget-doneRevMin);
  const due=dueUnits(p,date).map(u=>{const age=diffDays(u.d,date),over=diffDays(u.nx,date);return{u,age,pr:over*2+(100-(u.m==null?70:u.m))/10+(age<=7?6:0)+(age<=1?20:0)};}).sort((a,b)=>b.pr-a.pr);
  const sel={near:[],mid:[],far:[]};let acc=0;
  for(const d of due){const w=wordsOf(d.u.a,d.u.b),mn=w*lv.rv;if(d.age<=1||acc+mn<=budget||acc===0){sel[levelOf(d.u,date)].push(d.u);acc+=mn;}}
  const selIds=new Set();
  ["near","mid","far"].forEach(k=>{mergeUnits(sel[k],lv,k).forEach(t=>{tasks.push(t);t.units.forEach(i=>selIds.add(i));});});
  day.dueTotal=due.length;day.dueLeft=due.length-selIds.size;
  // آيات الأخطاء المتكررة
  const errs=Object.keys(p.err||{}).map(Number).filter(g=>p.err[g].r!==date).sort((x,y)=>(p.err[y].c-p.err[x].c)||(p.err[y].l<p.err[x].l?-1:1));
  const inSel=g=>{for(const u of p.units){if(selIds.has(u.i)&&g>=u.a&&g<=u.b)return true;}return false;};
  const wk=[];for(const g of errs){if(wk.length>=8)break;if(!inSel(g)&&!(doneT["weak"]))wk.push(g);}
  if(wk.length){wk.sort((a,b)=>a-b);const r=[];wk.forEach(g=>{const l=r[r.length-1];if(l&&l[1]+1===g)l[1]=g;else r.push([g,g]);});
    const w=r.reduce((s,x)=>s+wordsOf(x[0],x[1]),0);tasks.push({key:"weak",type:"weak",r,w,min:Math.max(3,Math.round(w*lv.rv*2)),units:[],ayat:wk});}
  // تراكمية السورة
  if(c.model==="cum"&&!doneT.cum){
    const ref=L.newR?fromGi(L.newR[0]).s:(p.units.length?fromGi(p.units[p.units.length-1].a).s:0);
    if(ref){const us=p.units.filter(u=>fromGi(u.a).s===ref&&u.d<date&&!selIds.has(u.i)).sort((a,b)=>a.a-b.a);
      let tot=0;const take=[];for(let i=us.length-1;i>=0;i--){const w=wordsOf(us[i].a,us[i].b);if(tot+w>PAGE_W*10&&take.length)break;tot+=w;take.unshift(us[i]);}
      if(take.length){const r=[];take.forEach(u=>{const l=r[r.length-1];if(l&&l[1]+1===u.a)l[1]=u.b;else r.push([u.a,u.b]);});
        tasks.push({key:"cum_"+take[0].a+"_"+take[take.length-1].b,type:"cum",r,w:tot,min:Math.max(2,Math.round(tot*lv.rv)),units:take.map(u=>u.i)});}}
  }
  const order={new:0,new2:6,near:1,weak:2,cum:3,mid:4,far:5};
  tasks.sort((a,b)=>order[a.type]-order[b.type]);
  day.tasks=tasks;
  day.stats=dayStats(tasks.concat(day.done.map(d=>({w:d.w||0,min:d.min||0,r:d.r||[]}))));
  const doneMin=day.done.reduce((s,t)=>s+(t.min||0),0),remMin=tasks.reduce((s,t)=>s+t.min,0);
  day.pct=doneMin+remMin?Math.round(doneMin/(doneMin+remMin)*100):(day.done.length?100:0);
  day.remMin=remMin;
  return day;
}
/* ---- تسجيل النتائج ---- */
function unitById(p,i){return p.units.find(u=>u.i===i);}
function applyScore(u,score,date,lad){
  if(score>=92)u.x=Math.min(lad.length-1,u.x+1);
  else if(score>=75){}
  else if(score>=50)u.x=Math.max(0,u.x-1);
  else u.x=0;
  let gap=lad[Math.min(u.x,lad.length-1)];
  if(score<75)gap=Math.max(1,Math.ceil(gap/2));
  if(score<50)gap=1;
  u.nx=addDays(date,gap);u.l=date;u.n=(u.n||0)+1;u.m=u.m==null?score:Math.round(u.m*.4+score*.6);
}
function noteErrors(p,date,reviewed,mist){
  p.err=p.err||{};const bad=new Set(mist);
  bad.forEach(g=>{const e=p.err[g]||(p.err[g]={c:0,k:0,l:date,r:date});e.c++;e.k=0;e.l=date;e.r=date;});
  reviewed.forEach(g=>{if(bad.has(g))return;const e=p.err[g];if(!e)return;e.r=date;e.k=(e.k||0)+1;if(e.k>=3)delete p.err[g];});
}
function rangesGi(r){const a=[];r.forEach(x=>{for(let g=x[0];g<=x[1];g++)a.push(g);});return a;}
function unitScore(u,mist,fallback){const mm=mist.filter(g=>g>=u.a&&g<=u.b);if(!mist.length&&fallback!=null)return fallback;const w=wordsOf(u.a,u.b);return Math.max(0,Math.round(100*(1-mm.length/Math.max(1,w))));}
/* res: {score,src,mist:[gi],partial?} */
function recordTask(p,date,task,res){
  const lad=ladderOf(p),L=p.log[date]=p.log[date]||{t:{}};L.t=L.t||{};
  const mist=(res.mist||[]).slice();let next=null,ok=true;
  const rec={type:task.type,r:task.r,w:task.w,min:task.min,score:res.score,src:res.src||"self",ts:Date.now(),bad:mist.length};
  noteErrors(p,date,rangesGi(task.r),mist);
  if(task.type==="new"){
    L.att=(L.att||0)+1;
    if(res.score>=70&&!res.partial){
      const g0=task.r[0][0],g1=task.r[0][1];
      const u={i:"u"+((p.uc=(p.uc||0)+1)),a:g0,b:g1,d:date,x:0,nx:addDays(date,1),l:date,n:1,m:res.score};
      p.units.push(u);next=u.nx;
      L.new={done:true,r:[g0,g1],score:res.score,src:rec.src,ts:rec.ts,bad:mist.length};
      L.t.new=rec;
    }else{ok=false;L.lastTry={score:res.score,ts:rec.ts,partial:!!res.partial};}
  }else if(task.type==="new2"||task.type==="weak"){
    if(res.partial)ok=false;else{L.t[task.key]=rec;if(task.type==="new2"){const u=p.units.find(x=>x.a===task.r[0][0]&&x.b===task.r[0][1]&&x.d===date);if(u&&res.score<75){u.m=Math.round(u.m*.5+res.score*.5);}}}
  }else{
    if(res.partial)ok=false;else{
      (task.units||[]).forEach(id=>{const u=unitById(p,id);if(!u)return;applyScore(u,unitScore(u,mist,res.score),date,lad);if(!next||u.nx<next)next=u.nx;});
      L.t[task.key]=rec;
    }
  }
  p.rev=(p.rev||0)+(ok&&task.type!=="new"?1:0);
  bump(p);prune(p,date);
  return{ok,next};
}
function prune(p,date){const keep=addDays(date,-400);Object.keys(p.log).forEach(d=>{if(d<keep)delete p.log[d];});}
/* ---- المحاكاة للتقويم ---- */
function simulate(p,days){
  const s=JSON.parse(JSON.stringify(p)),out={};let d=todayKey();
  for(let i=0;i<days;i++,d=addDays(d,1)){
    const day=buildDay(s,d,{sim:i>0});
    const rec={mode:day.mode,reason:day.reason,date:d,newR:null,near:0,mid:0,far:0,min:0,weak:0};
    day.tasks.forEach(t=>{rec.min+=t.min;if(t.type==="new")rec.newR=t.r[0];else if(t.type==="near"||t.type==="mid"||t.type==="far")rec[t.type]+=t.units.length;else if(t.type==="weak")rec.weak=1;});
    day.done.forEach(t=>{rec.min+=t.min||0;if(t.type==="new"&&t.r)rec.newR=t.r[0];});
    out[d]=rec;
    const lad=ladderOf(s);
    day.tasks.forEach(t=>{
      if(t.type==="new"){const u={i:"u"+((s.uc=(s.uc||0)+1)),a:t.r[0][0],b:t.r[0][1],d:d,x:0,nx:addDays(d,1),l:d,n:1,m:88};s.units.push(u);bump(s);}
      else if(t.units&&t.units.length){t.units.forEach(id=>{const u=unitById(s,id);if(u)applyScore(u,90,d,lad);});}
    });
  }
  return out;
}
/* ---- إنشاء/تعديل ---- */
function defaultCfg(){return{startMode:"first",startS:1,startA:1,dir:"fwd",unit:"page",val:5,days:[6,0,1,2,3],revDay:-1,target:0,level:"m",mins:60,model:"sab",method:"seq",reciter:(ST.listen&&ST.listen.reciter)||RECITERS[0][0],prior:"none",priorS:1,priorA:1,priorSurahs:[]};}
function chunkRange(g0,g1){const out=[];let g=g0;while(g<=g1){const pg=pageOfGi(g),pe=pg<604?PAGE_G[pg]-1:TOTAL-1,e=Math.min(g1,pe);out.push([g,e]);g=e+1;}return out;}
function importUnits(p,ranges,date,spreadDays){
  const chunks=[];ranges.forEach(r=>chunkRange(r[0],r[1]).forEach(c=>chunks.push(c)));
  // دمج أجزاء الصفحة الصغيرة المتتالية
  const merged=[];chunks.forEach(c=>{const l=merged[merged.length-1];if(l&&l[1]+1===c[0]&&wordsOf(l[0],c[1])<=PAGE_W*1.6)l[1]=c[1];else merged.push(c.slice());});
  const N=merged.length,lad=ladderOf(p);
  merged.forEach((c,i)=>{p.units.push({i:"u"+((p.uc=(p.uc||0)+1)),a:c[0],b:c[1],d:addDays(date,-90),x:Math.min({sab:7,srs:5,cum:6}[p.cfg.model]||4,lad.length-1),nx:addDays(date,N?Math.floor(i*spreadDays/N):0),l:addDays(date,-30),n:3,m:75});});
  bump(p);return N;
}
function createPlan(cfg,imp,dry){
  const date=todayKey();
  const p={v:1,ver:1,st:"active",created:date,cfg:cfg,units:[],err:{},log:{},uc:0,rev:0,hist:[{d:date,ev:"create"}]};
  // الآيات قبل نقطة البداية داخل سورة البداية لا تدخل الخطة
  cfg.skip=[];
  if(cfg.startMode==="surah"&&cfg.startA>1){cfg.skip.push([OFF[cfg.startS-1],OFF[cfg.startS-1]+cfg.startA-2]);}
  if(imp&&imp.ranges&&imp.ranges.length){
    const pgs=imp.ranges.reduce((s,r)=>s+wordsOf(r[0],r[1]),0)/PAGE_W;
    const perDay=Math.max(1,(cfg.mins*.45)/(PAGE_W*LV[cfg.level].rv));
    const spread=Math.max(7,Math.min(40,Math.ceil(pgs/perDay)));
    importUnits(p,imp.ranges,date,spread);
  }
  if(imp&&imp.segs&&imp.segs.length){
    const lad=ladderOf(p);
    imp.segs.forEach(sg=>{
      for(let g=gi(sg.s,sg.a);g<=gi(sg.s,sg.b);g++)if(p.units.some(u=>g>=u.a&&g<=u.b))return;
      p.units.push({i:"u"+((p.uc=(p.uc||0)+1)),a:gi(sg.s,sg.a),b:gi(sg.s,sg.b),d:sg.date||addDays(date,-30),x:Math.min(lad.length-1,sg.idx||0),nx:sg.next&&sg.next>date?sg.next:date,l:sg.last||date,n:sg.n||1,m:70});});
    bump(p);
  }
  bump(p);if(!dry){ST.plan=p;save();}return p;
}
function shiftOnResume(p,days){p.units.forEach(u=>{u.nx=addDays(u.nx,days);});Object.keys(p.err||{}).forEach(g=>{});}
/* ---- ملخص الإحصائيات ---- */
function statsOf(p){
  const mem=memArr(p);let ay=0,w=0,mw=0;
  for(let g=0;g<TOTAL;g++){if(mem[g]===1){ay++;mw+=WC[g];}}
  let juz=0;for(let j=0;j<30;j++){const a=JUZ_GI[j],b=j<29?JUZ_GI[j+1]-1:TOTAL-1;let all=true;for(let g=a;g<=b;g++)if(mem[g]!==1){all=false;break;}if(all)juz++;}
  let surahs=0;const surahDone=[];for(let s=1;s<=114;s++){let all=true;for(let g=OFF[s-1];g<OFF[s-1]+SC[s-1];g++)if(mem[g]!==1){all=false;break;}if(all){surahs++;surahDone.push(s);}}
  let pages=0;for(let pg=1;pg<=604;pg++){const a=PAGE_G[pg-1],b=pg<604?PAGE_G[pg]-1:TOTAL-1;let all=true;for(let g=a;g<=b;g++)if(mem[g]!==1){all=false;break;}if(all)pages++;}
  let mast=0,mwt=0;p.units.forEach(u=>{const ww=wordsOf(u.a,u.b);mast+=(u.m==null?70:u.m)*ww;mwt+=ww;});
  const today=todayKey();let revs=0;Object.keys(p.log).forEach(d=>{const L=p.log[d];if(L.t)Object.keys(L.t).forEach(k=>{if(L.t[k].type!=="new"&&L.t[k].type!=="new2")revs++;});});
  // الالتزام الأسبوعي: آخر ٢٨ يومًا
  let planned=0,active=0;for(let i=0;i<28;i++){const d=addDays(today,-i);if(d<p.created)break;planned++;const L=p.log[d];if(L&&L.t&&Object.keys(L.t).length)active++;}
  // سور تحتاج مراجعة
  const bySurah={};p.units.forEach(u=>{const s=fromGi(u.a).s;const o=bySurah[s]||(bySurah[s]={s,w:0,ms:0,over:0});const ww=wordsOf(u.a,u.b);o.w+=ww;o.ms+=(u.m==null?70:u.m)*ww;o.over=Math.max(o.over,Math.max(0,diffDays(u.nx,today)));});
  const need=Object.values(bySurah).map(o=>({s:o.s,m:Math.round(o.ms/o.w),over:o.over})).sort((a,b)=>(a.m-b.m)||(b.over-a.over)).slice(0,6);
  const errs=Object.keys(p.err||{}).map(Number).map(g=>Object.assign({g},p.err[g])).sort((a,b)=>b.c-a.c).slice(0,12);
  return{ay,pages,juz,surahs,mastery:mwt?Math.round(mast/mwt):0,revs,adherence:planned?Math.round(active/planned*100):0,planned,active,need,errs,remAy:remainingAyat(p),remW:remainingWords(p),total:TOTAL};
}
window.PLAN={PAGE_W,WD_NAMES,WEEK_ORDER,WC,PW,PAGE_G,pageOfGi,wordsOf,pagesOf,wdOf,labG,labR,LV,UNITS,MODELS,METHODS_MEM,REVIEW_NAMES,PL,bump,memArr,nextPortion,takePortion,remainingWords,remainingAyat,memWords,ladderOf,projectFinish,buildDay,ensureDay,recordTask,simulate,defaultCfg,createPlan,shiftOnResume,statsOf,dayStats,targetWords,avgNewWords,orderSurahs,chunkRange,rangesGi,levelOf,noteErrors,unitById,applyScore,cycleDays};
})();
/* خطتي لحفظ القرآن الكريم: الواجهة */
(function(){
"use strict";
const P=window.PLAN;
const {PAGE_W,WD_NAMES,WEEK_ORDER,wordsOf,pagesOf,wdOf,labG,labR,LV,MODELS,METHODS_MEM,REVIEW_NAMES}=P;
const css=`
.pl-tabs{display:flex;gap:6px;margin:0 0 14px;background:#eee8d9;padding:5px;border-radius:16px;overflow-x:auto}
.pl-tabs a{flex:1;text-align:center;text-decoration:none;padding:9px 12px;border-radius:12px;white-space:nowrap;font-weight:600;color:#7a7668;font-size:14px}
.pl-tabs a.on{background:var(--paper);color:var(--g8);font-weight:700;box-shadow:0 2px 8px rgba(16,43,39,.12)}
.pl-hero{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.pl-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.pl-stat div{background:var(--g1);border-radius:14px;padding:10px 6px;text-align:center}
.pl-stat b{display:block;font-size:19px;color:var(--g8)}
.pl-stat span{font-size:12px;color:var(--mute)}
.pl-task{border:1px solid var(--line);border-radius:16px;padding:14px;margin:0 0 10px;background:#fff;box-shadow:0 1px 3px rgba(16,43,39,.04);display:block;text-decoration:none;color:inherit}
.pl-task.done{background:#f3f8f5;border-color:#cfe3d9}
.pl-task .tt{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
.pl-lv{display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700}
.pl-lv.new,.pl-lv.new2{background:#f7ecd0;color:#7d5c12}
.pl-lv.near{background:#dcefe6;color:#0d3833}
.pl-lv.mid{background:#e3ecf5;color:#254a6b}
.pl-lv.far{background:#ece6f3;color:#4a3668}
.pl-lv.weak{background:#f6e3de;color:var(--bad)}
.pl-lv.cum{background:#e8f1ed;color:var(--g7)}
.pl-bar{height:9px;background:var(--g1);border-radius:9px;overflow:hidden}
.pl-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold2),var(--gold));border-radius:9px}
.pl-chips{display:flex;flex-wrap:wrap;gap:8px}
.pl-chip{border:1.5px solid var(--line);background:#fff;border-radius:14px;padding:8px 14px;font-weight:600;min-height:40px}
.pl-chip.on{background:var(--g8);color:#fff;border-color:var(--g8)}
.pl-opt{border:1.5px solid var(--line);background:#fff;border-radius:16px;padding:12px 14px;margin:0 0 8px;display:block;cursor:pointer}
.pl-opt.on{border-color:var(--g5);background:#f2f8f5;box-shadow:0 0 0 3px rgba(47,133,119,.12)}
.pl-opt b{display:block;color:var(--g8)}
.pl-sum{border:1.5px solid var(--gold2);background:linear-gradient(160deg,#fdf8e8,#faf1d8)}
.pl-warn{border-color:#e6b9a9;background:#fbf0ec}
.pl-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.pl-d{border:1px solid var(--line);border-radius:12px;padding:8px 2px;text-align:center;background:#fff;text-decoration:none;color:inherit;font-size:12px;min-height:64px;display:flex;flex-direction:column;justify-content:center;gap:2px}
.pl-d b{font-size:15px}
.pl-d.today{border:2px solid var(--gold2)}
.pl-d.ok{background:#e4f1ea}.pl-d.part{background:#fbf0cd}.pl-d.miss{background:#f8e7e1}.pl-d.rest{background:#f1efe6;color:var(--mute)}.pl-d.plan{background:#fff}
.pl-d.none{visibility:hidden}
.pl-mon{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.pl-mon .pl-d{min-height:48px;padding:5px 1px}
.pl-hd{font-size:11px;color:var(--mute);text-align:center}
.pl-q{font-size:24px;line-height:2.3;text-align:justify;text-align-last:center}
.pl-q .an{font-size:.8em;color:var(--gold)}
.pl-q.hide span.t{filter:blur(9px);user-select:none}
.pl-chart{display:flex;align-items:flex-end;gap:4px;height:90px;margin-top:8px}
.pl-chart i{flex:1;background:linear-gradient(180deg,var(--gold2),var(--gold));border-radius:5px 5px 0 0;min-height:2px;position:relative}
.pl-chart i.z{background:var(--g1)}
.pl-note{font-size:13px;color:var(--mute)}
.pl-src a{display:block;color:var(--g7);font-size:13px;margin-top:4px;word-break:break-all}
.pl-banner{background:linear-gradient(150deg,var(--g9),var(--g8) 55%,var(--g7));color:#fff;border:0;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.pl-banner b{font-size:18px}
.pl-banner .btn{background:linear-gradient(160deg,var(--gold2),var(--gold))}
.pl-mem-step{border:1.5px solid var(--g5);border-radius:18px;padding:16px;background:#fff}
.ay.pl{background:#e6f1ec;border-radius:6px}
.ay.at{box-shadow:inset 0 -3px 0 var(--g5)}
.pl-rbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}
`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
const tdy=()=>todayKey();
const TABS=[["","اليوم"],["calendar","التقويم"],["stats","الإحصائيات"],["methods","الطرق"],["settings","الإعدادات"]];
function shell(active,inner){
  return '<div class="pl-tabs">'+TABS.map(t=>'<a href="#/plan'+(t[0]?"/"+t[0]:"")+'" class="'+(active===t[0]?"on":"")+'">'+t[1]+'</a>').join("")+'</div>'+inner;
}
const fmtMin=m=>{m=Math.round(m);if(m<60)return n(m)+" دقيقة";const h=Math.floor(m/60),r=m%60;return n(h)+" ساعة"+(r?" و"+n(r)+" دقيقة":"");};
const pgTxt=w=>{const p=pagesOf(w);return p<0.1?"أقل من ١٠٪ صفحة":(p===1?"صفحة":n(p)+" صفحة");};
function ayCnt(r){return r.reduce((s,x)=>s+x[1]-x[0]+1,0);}
function dateAr(k,o){return new Intl.DateTimeFormat("ar-EG",Object.assign({weekday:"long",day:"numeric",month:"long",timeZone:"UTC"},o||{})).format(new Date(k+"T00:00:00Z"));}
function wdName(k){return WD_NAMES[wdOf(k)];}
const srcLabel=s=>s==="tasmee"?"تسميع بالميكروفون":"تقييم ذاتي";
/* ===== الدخول ===== */
function pgPlan(parts){
  const p=P.PL();
  const r=parts[0]||"";
  if(r==="setup"||(!p&&r!=="methods"&&r!=="mem"))return pgSetup(false);
  if(r==="methods")return pgMethods();
  if(r==="settings")return pgSettings();
  if(r==="calendar")return pgCalendar();
  if(r==="stats")return pgStats();
  if(r==="task")return pgTask(decodeURIComponent(parts[1]||""));
  if(r==="day")return pgDay(parts[1]);
  if(r==="mem")return window.planMem(parts.slice(1));
  return pgDash();
}
window.pgPlan=pgPlan;
/* ===== لوحة اليوم ===== */
function pgDash(){
  const p=P.PL(),c=p.cfg,date=tdy();
  const day=P.buildDay(p,date);
  if(day.paused){
    view.innerHTML=shell("",'<h1>خطتي لحفظ القرآن الكريم</h1><div class="card"><h2>الخطة متوقفة مؤقتًا</h2><p class="muted">تقدّمك محفوظ كما هو. عند الاستئناف تُؤجَّل مواعيد المراجعة بمقدار مدة التوقف حتى لا تتراكم عليك.</p><button class="btn gold" id="plResume">استئناف الخطة</button></div>');
    $("#plResume").onclick=()=>resumePlan();return;
  }
  const S=P.statsOf(p),fin=P.projectFinish(p);
  const wk=weekPct(p);
  const tdone=day.done.length,ttotal=day.done.length+day.tasks.length;
  let h='<div class="row sp"><h1 style="margin:0">خطتي لحفظ القرآن الكريم</h1></div>';
  h+='<div style="height:10px"></div>';
  h+='<div class="card hero"><div class="pl-hero"><div class="ring" style="--p:'+day.pct+'"><div>'+n(day.pct)+'٪<small>إنجاز اليوم</small></div></div><div class="grow"><div class="lbl">'+dateAr(date)+'</div><div style="font-size:21px;font-weight:800">'+(day.mode==="study"?"يوم حفظ ومراجعة":"يوم مراجعة")+'</div><div class="lbl" style="margin-top:2px">أنجزتِ '+n(tdone)+' من '+n(ttotal)+' مهام</div></div></div>'
   +'<div class="pl-stat" style="color:var(--ink)"><div><b>'+n(day.stats.ay)+'</b><span>آية اليوم</span></div><div><b>'+n(day.stats.pg)+'</b><span>صفحة</span></div><div><b>'+n(Math.round(day.stats.min))+'</b><span>دقيقة تقديرًا</span></div></div></div>';
  if(day.reason)h+='<div class="card pl-warn"><p style="margin:0">'+esc(day.reason)+'</p></div>';
  const sug=suggest(p,day);if(sug)h+=sug.html;
  h+='<div class="card"><h2>مهام اليوم</h2>';
  if(!day.tasks.length&&!day.done.length)h+='<p class="muted">لا توجد مهام مستحقة اليوم. بارك الله فيكِ، يمكنك مراجعة ما تشائين من المصحف.</p>';
  day.tasks.forEach(t=>{h+=taskCard(t,false);});
  day.done.slice().sort((a,b)=>(a.ts||0)-(b.ts||0)).forEach(t=>{h+=taskCard(t,true);});
  if(day.dueLeft>0)h+='<p class="pl-note">بقي '+n(day.dueLeft)+' مقطعًا مستحقًّا لم يدخل جدول اليوم لضيق الوقت، وسيتقدّم غدًا. إن أنجزتِ ما سبق ولديك وقت فاستمري من التقويم.</p>';
  h+='</div>';
  h+='<div class="card"><h2>تقدّمك في الخطة</h2><div class="grid2" style="gap:12px"><div class="pl-stat" style="grid-template-columns:1fr 1fr;margin:0;grid-column:1/-1"><div><b>'+n(S.ay)+'</b><span>إجمالي المحفوظ (آية)</span></div><div><b>'+n(S.revs)+'</b><span>إجمالي المراجعات المسجّلة</span></div><div><b>'+n(S.remAy)+'</b><span>المتبقي من الخطة (آية)</span></div><div><b>'+n(S.mastery)+'٪</b><span>إتقان المحفوظ</span></div></div></div>'
   +'<div class="pl-bar" style="margin-top:12px"><i style="width:'+Math.min(100,Math.round(S.ay/TOTAL*100))+'%"></i></div><p class="pl-note" style="margin:6px 0 0">'+n(Math.round(S.ay/TOTAL*1000)/10)+'٪ من القرآن'+(fin.days>0?' · المتوقع إتمام الحفظ: '+fmtDate(fin.date):'')+'</p>'
   +'<p class="pl-note" style="margin:6px 0 0">إنجاز آخر ٧ أيام: <b>'+n(wk)+'٪</b></p></div>';
  h+='<div class="card"><div class="row sp"><h2 style="margin:0">هذا الأسبوع</h2><a href="#/plan/calendar" class="btn soft sm" style="text-decoration:none">التقويم</a></div><div style="height:10px"></div>'+weekStrip(p,0)+'</div>';
  h+='<div class="row" style="margin-bottom:10px"><a class="btn soft sm" style="text-decoration:none" href="#/plan/mem/free">احفظ معي</a><a class="btn soft sm" style="text-decoration:none" href="#/tasmee3">التسميع</a><a class="btn soft sm" style="text-decoration:none" href="#/hifz">خطة الحفظ السابقة</a></div>';
  view.innerHTML=shell("",h);
  const sb=$("#plSug");if(sb&&sug)sb.onclick=()=>{sug.apply();save();pgDash();};
  const sx=$("#plSugX");if(sx&&sug)sx.onclick=()=>{p.sugSkip=date;save();pgDash();};
  const fb=$("#plForce");if(fb)fb.onclick=()=>forceStudy(p);
}
function taskCard(t,done){
  const ay=ayCnt(t.r);
  const href=done?'#/plan/task/'+encodeURIComponent(t.key):'#/plan/task/'+encodeURIComponent(t.key);
  return '<a class="pl-task'+(done?" done":"")+'" href="'+href+'"><div class="tt"><span class="pl-lv '+t.type+'">'+REVIEW_NAMES[t.type]+'</span>'+(done?'<span class="pill gold">تم ✓ '+(t.score!=null?n(t.score)+'٪':"")+'</span>':'<span class="pill">نحو '+n(Math.round(t.min))+' د</span>')+'</div>'
   +'<div style="margin-top:6px;font-weight:700;color:var(--g8)">'+esc(labR(t.r))+'</div>'
   +'<div class="pl-note">'+n(ay)+' آية · '+pgTxt(t.w)+(done?' · '+srcLabel(t.src):'')+'</div></a>';
}
function weekPct(p){let a=0,k=0;const T=tdy();for(let i=1;i<=7;i++){const d=addDays(T,-i);const L=p.log[d];if(!L||!L.mode)continue;if(d<p.created)continue;k++;const done=L.t?Object.keys(L.t).length:0;const need=(L.mode==="study"?1:0);if(done||!need)a+=done?1:0.5*0;else a+=0;}
  // نسبة الأيام التي أُنجز فيها شيء من الأيام المخطَّطة
  let planned=0,act=0;for(let i=0;i<7;i++){const d=addDays(T,-i);if(d<p.created)continue;planned++;const L=p.log[d];if(L&&L.t&&Object.keys(L.t).length)act++;}
  return planned?Math.round(act/planned*100):0;}
function dayState(p,d,sim){
  const T=tdy(),L=p.log[d];
  if(d>T)return sim&&sim[d]?(sim[d].mode==="study"?"plan":"rest"):"plan";
  const done=L&&L.t?Object.keys(L.t).length:0;
  if(d===T)return done?"ok today":"plan today";
  if(d<p.created)return "none";
  if(!done)return "miss";
  const hadNew=L.mode==="study"&&L.newR;const newDone=L.new&&L.new.done;
  return (hadNew&&!newDone)?"part":"ok";
}
function weekStrip(p,off){
  const T=tdy();const wd=wdOf(T);const sat=addDays(T,-((wd+1)%7)+off*7);
  const sim=P.simulate(p,40);
  let h='<div class="pl-week">';
  for(let i=0;i<7;i++){const d=addDays(sat,i);const sdv=dayState(p,d,sim);const dd=new Date(d+"T00:00:00Z").getUTCDate();
    h+='<a class="pl-d '+sdv+'" href="#/plan/day/'+d+'"><span>'+WD_NAMES[wdOf(d)].replace("ال","")+'</span><b>'+n(dd)+'</b></a>';}
  return h+'</div><p class="pl-note" style="margin:8px 0 0">أخضر: تم · أصفر: ناقص · أحمر: فائت · أبيض: مخطَّط · رمادي: يوم راحة من الحفظ الجديد</p>';
}
/* ===== اقتراحات تكيّفية ===== */
function suggest(p,day){
  const T=tdy();if(p.sugSkip===T)return null;
  const c=p.cfg;
  if(day.mode==="revonly"&&day.reason.indexOf("تراكمت")>=0&&!(p.log[T]&&p.log[T].force)){
    return{html:'<div class="card pl-warn"><b>مراجعات متراكمة</b><p>الأفضل تصفية المراجعة أولًا حتى لا يضعف المحفوظ. يمكنك مع ذلك أن تحفظي الجديد اليوم.</p><button class="btn soft sm" id="plForce">حفظ جديد رغم ذلك</button></div>',apply:()=>{}};
  }
  const sc=[];for(let i=1;i<=14;i++){const L=p.log[addDays(T,-i)];if(L&&L.t)Object.keys(L.t).forEach(k=>{if(L.t[k].score!=null&&L.t[k].type!=="new2")sc.push(L.t[k].score);});if(L&&L.new&&L.new.score!=null)sc.push(L.new.score);}
  if(sc.length>=8){const avg=sc.reduce((a,b)=>a+b,0)/sc.length;
    if(avg>=94&&c.unit!=="juz"){return{html:'<div class="card" style="border-color:var(--g5)"><b>اقتراح</b><p>نتائجك في آخر أسبوعين ممتازة (متوسط '+n(Math.round(avg))+'٪). يمكنك رفع مقدار الحفظ الجديد قليلًا.</p><div class="row"><button class="btn sm" id="plSug">ارفعي المقدار</button><button class="btn ghost sm" id="plSugX">ليس الآن</button></div></div>',apply:()=>raiseAmount(p)};}
  }
  return null;
}
function raiseAmount(p){const c=p.cfg;
  if(c.unit==="ayat")c.val=(c.val||5)+(c.val>=10?3:2);
  else if(c.unit==="half")c.unit="page";
  else if(c.unit==="page")c.unit="pagesx",c.val=1.5;
  else if(c.unit==="pagesx")c.val=Math.round((c.val+.5)*2)/2;
  else if(c.unit==="pages2"){c.unit="pagesx";c.val=2.5;}
  clearFrozen(p);P.bump(p);}
function clearFrozen(p){const L=p.log[tdy()];if(L&&!(L.new&&L.new.done)){delete L.mode;delete L.newR;delete L.reason;delete L.scale;}}
function forceStudy(p){const T=tdy();const L=p.log[T];const np=P.nextPortion(p,1);if(!np)return;if(L){L.mode="study";L.newR=[np.g0,np.g1];L.force=1;L.reason="";}save();pgDash();}
function resumePlan(){const p=P.PL();const T=tdy();if(p.pausedAt){const dl=diffDays(p.pausedAt,T);if(dl>0)P.shiftOnResume(p,dl);}p.st="active";p.pausedAt=null;p.hist.push({d:T,ev:"resume"});clearFrozen(p);P.bump(p);save();toast("تم استئناف الخطة");location.hash="#/plan";pgDash();}
/* ===== صفحة المهمة ===== */
function findTask(p,key){const day=P.buildDay(p,tdy());let t=day.tasks.find(x=>x.key===key);if(t)return{t,done:false,day};const d=day.done.find(x=>x.key===key);if(d)return{t:d,done:true,day};return{t:null,day};}
function textBlock(r,hidden){
  let h='<div class="quran pl-q'+(hidden?" hide":"")+'" id="plTxt">',count=0;
  for(const x of r){for(let g=x[0];g<=x[1];g++){if(count>=80){h+='<span class="pl-note">… والباقي في المصحف.</span>';return h+'</div>';}const f=fromGi(g);h+='<span class="t">'+esc(ayahText(f.s,f.a))+'</span> <span class="an">﴿'+n(f.a)+'﴾</span> ';count++;}}
  return h+'</div>';
}
function pgTask(key){
  const p=P.PL();const c=p.cfg;const f=findTask(p,key);
  if(!f.t){view.innerHTML=shell("",'<div class="card"><p>تم تحديث جدول اليوم. ارجعي للوحة لتري المهام الحالية.</p><a class="btn" style="text-decoration:none" href="#/plan">لوحة اليوم</a></div>');return;}
  const t=f.t,done=f.done,lv=LV[c.level],rn=REVIEW_NAMES[t.type];
  const R0=t.r[0],f0=fromGi(R0[0]),f1=fromGi(R0[1]);
  let how="";
  if(t.type==="new")how='<ol style="margin:0;padding-inline-start:20px"><li>استمعي إلى المقطع من القارئ المحدّد نحو <b>'+n(lv.listen)+'</b> مرات متابِعةً النص.</li><li>اتّبعي طريقة الحفظ التي اخترتِها ('+METHODS_MEM[c.method]+') بالضغط على «احفظ معي».</li><li>قرأة المقطع من المصحف ثم تسميعه غيبًا.</li><li>سمّعيه بالميكروفون ليُسجَّل إنجازك وتُحدَّد المواضع التي تحتاج إعادة.</li></ol>';
  else if(t.type==="new2")how='<p style="margin:0">سمّعي ما حفظتِه اليوم قبل النوم من غير نظر، فهذه مراجعة اليوم نفسه التي تثبّت الحفظ.</p>';
  else if(t.type==="weak")how='<p style="margin:0">هذه الآيات تكرّر فيها الخطأ في تسميعاتك الأخيرة. استمعي إليها ٣ مرات ثم سمّعيها. ستخرج من القائمة بعد ٣ مراجعات صحيحة متتالية.</p>';
  else how='<p style="margin:0">اقرئي المقطع من حفظك دون نظر، ثم سمّعيه ليُسجَّل إنجازك. الأخطاء تقصّر موعد المراجعة القادمة، والإتقان يطيله.</p>';
  let h='<div class="row sp"><a href="#/plan" class="btn soft sm" style="text-decoration:none">‹ الخطة</a><span class="pl-lv '+t.type+'">'+rn+'</span></div><div style="height:10px"></div>';
  h+='<div class="card"><h2 style="margin-bottom:4px">'+esc(labR(t.r))+'</h2><div class="pl-note">'+n(ayCnt(t.r))+' آية · '+pgTxt(t.w)+' · نحو '+n(Math.round(t.min))+' دقيقة</div></div>';
  if(done){
    h+='<div class="card" style="border-color:var(--g5)"><div class="row sp"><h2 style="margin:0">تم تسجيل الإنجاز ✓</h2><span class="pill gold">'+n(t.score)+'٪</span></div><p class="muted" style="margin:6px 0 0">'+srcLabel(t.src)+(t.bad?' · '+n(t.bad)+' موضعًا للتصحيح':'')+'</p></div>';
  }else{
    h+='<div class="card"><h2>ماذا تفعلين؟</h2>'+how+'</div>';
    h+='<div class="card"><div class="row"><button class="btn" id="tkListen">استمعي'+(t.type==="new"?' ×'+n(lv.listen):'')+'</button>'+(t.type==="new"||t.type==="weak"?'<a class="btn soft" style="text-decoration:none" href="#/plan/mem/'+R0[0]+'/'+R0[1]+'/'+encodeURIComponent(t.key)+'">احفظ معي</a>':'')+'<a class="btn soft" style="text-decoration:none" href="#/quran/r/'+R0[0]+'/'+R0[1]+'/'+encodeURIComponent(t.key)+'">المصحف</a></div>'
     +'<div class="row" style="margin-top:10px"><button class="btn gold" id="tkTasmee">سمّعي بالميكروفون</button><button class="btn ghost" id="tkSelf">سجّلي بتقييم ذاتي</button></div><p class="pl-note" style="margin:8px 0 0">لا تُحسب المهمة منجزة بمجرد فتحها. تُسجَّل بعد التسميع أو التقييم الذاتي.</p></div>';
    h+='<div class="card"><div class="row sp"><h2 style="margin:0">النص</h2><button class="btn soft sm" id="tkHide">إخفاء للتسميع الذاتي</button></div><div style="height:6px"></div>'+textBlock(t.r,false)+'</div>';
  }
  if(t.r.length>1)h+='<div class="card"><h2>المقاطع</h2>'+t.r.map(x=>'<a class="pl-task" href="#/quran/r/'+x[0]+'/'+x[1]+'/'+encodeURIComponent(t.key)+'">'+esc(labG(x[0],x[1]))+'</a>').join("")+'</div>';
  view.innerHTML=shell("",h);
  if(!done){
    $("#tkListen").onclick=()=>listenRanges(t.r,{reps:t.type==="new"?lv.listen:(t.type==="weak"?3:1),reciter:c.reciter});
    $("#tkTasmee").onclick=()=>startTasmee(t);
    $("#tkSelf").onclick=()=>selfRate(t);
    $("#tkHide").onclick=()=>{const x=$("#plTxt");x.classList.toggle("hide");$("#tkHide").textContent=x.classList.contains("hide")?"إظهار النص":"إخفاء للتسميع الذاتي";};
  }
}
/* ===== الاستماع على نطاق عام ===== */
function segsFromRanges(r){const out=[];r.forEach(x=>{let g=x[0];while(g<=x[1]){const f=fromGi(g),endS=OFF[f.s-1]+SC[f.s-1]-1,e=Math.min(x[1],endS);out.push({s:f.s,from:f.a,to:fromGi(e).a});g=e+1;}});return out;}
function listenRanges(r,o){
  o=o||{};const segs=segsFromRanges(r);if(!segs.length)return;
  const f=segs.shift();
  pStart({reciter:o.reciter||ST.listen.reciter,s:f.s,from:f.from,to:f.to,rep:o.rep||1,rr:o.reps||1,gap:o.gap||"none",speed:o.speed||1,next:false,queue:segs});
  toast("بدأ الاستماع");
}
window.planListen=listenRanges;
window.planSegs=segsFromRanges;
/* ===== التسميع بالميكروفون ===== */
function startTasmee(t){
  const segs=[];
  t.r.forEach(x=>{tsmSegsGi(x[0],x[1]).forEach(s=>segs.push(s));});
  const lbl="الخطة · "+labR(t.r);
  window.__planCtx={key:t.key,type:t.type,r:t.r,w:t.w,min:t.min,units:t.units||[],date:tdy(),lbl:lbl,ts:Date.now(),ayat:t.ayat||null};
  tsmStart(segs,lbl);
}
window.planStartTasmee=startTasmee;
window.planOnTasmee=function(entry){
  const ctx=window.__planCtx,p=P.PL();
  if(!ctx||!p||ctx.lbl!==entry.lbl||Date.now()-ctx.ts>6*36e5)return;
  const cov=entry.words/Math.max(1,ctx.w);
  const mist=(entry.mist||[]).map(m=>gi(m.s,m.a));
  const task={key:ctx.key,type:ctx.type,r:ctx.r,w:ctx.w,min:ctx.min,units:ctx.units};
  const partial=cov<0.7;
  const res=P.recordTask(p,ctx.date,task,{score:entry.score,src:"tasmee",mist:mist,partial:partial});
  save();window.__planCtx=null;
  setTimeout(()=>{
    const card=document.createElement("div");card.className="card";card.style.borderColor="var(--g5)";
    let msg;
    if(partial)msg='<h2>لم تُسجَّل المهمة بعد</h2><p>سمّعتِ نحو '+n(Math.round(cov*100))+'٪ فقط من المقطع. أكملي المقطع كله حتى تُحتسب المهمة. أُضيفت المواضع الخاطئة إلى قائمة التثبيت.</p>';
    else if(ctx.type==="new"&&!res.ok)msg='<h2>يحتاج المقطع إعادة</h2><p>نتيجتك '+n(entry.score)+'٪ ولم تبلغ ٧٠٪ المطلوبة لاعتماد الحفظ. سيبقى المقطع نفسه مهمة اليوم حتى يثبت.</p>';
    else msg='<h2>سُجّل إنجازك في الخطة ✓</h2><p>النتيجة '+n(entry.score)+'٪'+(mist.length?' · '+n(mist.length)+' موضعًا سيدخل التثبيت':'')+'.'+(res.next?' موعد المراجعة القادمة: <b>'+fmtDate(res.next)+'</b>.':'')+'</p>';
    card.innerHTML=msg+'<a class="btn" style="text-decoration:none" href="#/plan">العودة إلى خطتي</a>';
    const v=document.getElementById("app");if(v)v.appendChild(card);
  },400);
};
/* ===== تقييم ذاتي ===== */
function selfRate(t){
  const ay=[];t.r.forEach(x=>{for(let g=x[0];g<=x[1];g++)ay.push(g);});
  const isNew=t.type==="new";
  const opts=isNew?[["96","حفظته جيدًا"],["78","حفظته مع تعثّر في مواضع"],["40","لم أحفظه بعد"]]:[["96","ممتاز بلا أخطاء"],["78","جيد مع أخطاء قليلة"],["45","ضعيف وأحتاج إعادة"]];
  const m=modal('<h3>سجّلي نتيجتك</h3><p class="muted">'+esc(labR(t.r))+'</p>'+opts.map((o,i)=>'<label class="pl-opt'+(i===0?" on":"")+'"><input type="radio" name="sr" value="'+o[0]+'"'+(i===0?" checked":"")+' style="display:none"><b>'+o[1]+'</b></label>').join("")
   +(ay.length<=60?'<label class="f">الآيات التي أخطأتِ فيها (اختياري)</label><div class="pl-chips" id="srM">'+ay.map(g=>{const f=fromGi(g);return '<button type="button" class="pl-chip" data-g="'+g+'">'+n(f.a)+(f.s!==fromGi(ay[0]).s?" ("+SN[f.s-1]+")":"")+'</button>';}).join("")+'</div>':'')
   +'<div class="row" style="margin-top:14px"><button class="btn gold" id="srOk">تسجيل</button><button class="btn ghost" id="srNo">إلغاء</button></div>');
  $$(".pl-opt",m).forEach(l=>l.onclick=()=>{$$(".pl-opt",m).forEach(x=>x.classList.remove("on"));l.classList.add("on");l.querySelector("input").checked=true;});
  $$("#srM .pl-chip",m).forEach(b=>b.onclick=()=>b.classList.toggle("on"));
  $("#srNo",m).onclick=()=>m.close();
  $("#srOk",m).onclick=()=>{
    const sc=+($("input[name=sr]:checked",m).value);const mist=$$("#srM .pl-chip.on",m).map(b=>+b.dataset.g);
    const p=P.PL();const res=P.recordTask(p,tdy(),t,{score:sc,src:"self",mist});save();m.close();
    if(!res.ok&&isNew)toast("لم يُعتمد الحفظ بعد. يبقى المقطع مهمة اليوم.");
    else toast("تم تسجيل الإنجاز"+(res.next?". المراجعة القادمة: "+fmtDate(res.next):""));
    location.hash="#/plan";pgDash();
  };
}
/* ===== اليوم من التقويم ===== */
function pgDay(d){
  const p=P.PL();const T=tdy();
  if(!d||d===T){location.hash="#/plan";return;}
  let h='<div class="row sp"><a href="#/plan/calendar" class="btn soft sm" style="text-decoration:none">‹ التقويم</a></div><div style="height:10px"></div>';
  h+='<h1>'+dateAr(d)+'</h1>';
  if(d<T){
    const L=p.log[d];
    if(!L||!L.t||!Object.keys(L.t).length)h+='<div class="card"><p class="muted">لم تُسجَّل مهام في هذا اليوم.</p></div>';
    else{
      h+='<div class="card"><h2>ما أُنجز</h2>';
      Object.keys(L.t).map(k=>Object.assign({key:k},L.t[k])).sort((a,b)=>(a.ts||0)-(b.ts||0)).forEach(t=>{h+='<div class="pl-task done"><div class="tt"><span class="pl-lv '+t.type+'">'+REVIEW_NAMES[t.type]+'</span><span class="pill gold">'+n(t.score)+'٪</span></div><div style="margin-top:6px;font-weight:700;color:var(--g8)">'+esc(labR(t.r))+'</div><div class="pl-note">'+srcLabel(t.src)+(t.bad?' · '+n(t.bad)+' موضعًا للتصحيح':'')+'</div></div>';});
      h+='</div>';
    }
  }else{
    const sim=P.simulate(p,70)[d];
    if(!sim)h+='<div class="card"><p class="muted">اليوم خارج مدى التوقع (٧٠ يومًا).</p></div>';
    else{
      h+='<div class="card"><p class="pl-note" style="margin-top:0">خطة متوقعة، تتغير حسب أدائك.</p>';
      if(sim.mode==="study"&&sim.newR)h+='<div class="pl-task"><span class="pl-lv new">الحفظ الجديد</span><div style="margin-top:6px;font-weight:700;color:var(--g8)">'+esc(labG(sim.newR[0],sim.newR[1]))+'</div></div>';
      else h+='<div class="pl-task"><b>يوم مراجعة</b><div class="pl-note">'+esc(sim.reason||"بدون حفظ جديد")+'</div></div>';
      h+='<div class="pl-task"><div class="pl-note">مراجعة قريبة: <b>'+n(sim.near)+'</b> مقطع · متوسطة: <b>'+n(sim.mid)+'</b> · بعيدة: <b>'+n(sim.far)+'</b></div><div class="pl-note">الوقت التقديري: نحو '+n(Math.round(sim.min))+' دقيقة</div></div></div>';
    }
  }
  view.innerHTML=shell("calendar",h);
}
/* ===== التقويم ===== */
const calS={mode:"week",wo:0,mo:0};
function pgCalendar(){
  const p=P.PL();const T=tdy();const sim=P.simulate(p,75);
  let h='<h1>التقويم</h1><div class="tabs"><button data-m="week" class="'+(calS.mode==="week"?"on":"")+'">أسبوعي</button><button data-m="month" class="'+(calS.mode==="month"?"on":"")+'">شهري</button></div>';
  if(calS.mode==="week"){
    const wd=wdOf(T),sat=addDays(T,-((wd+1)%7)+calS.wo*7);
    h+='<div class="row sp" style="margin-bottom:10px"><button class="btn soft sm" id="cwP">‹ الأسبوع السابق</button><b>'+fmtDate(sat)+'</b><button class="btn soft sm" id="cwN">التالي ›</button></div>';
    for(let i=0;i<7;i++){const d=addDays(sat,i);const sdv=dayState(p,d,sim);const L=p.log[d];const s=sim[d];
      let line="";
      if(d<T){const dn=L&&L.t?Object.keys(L.t).length:0;line=dn?'أُنجز '+n(dn)+' مهام'+(L.new&&L.new.done?' · حفظ جديد: '+esc(labG(L.new.r[0],L.new.r[1])):''):(d<p.created?'قبل بداية الخطة':'لم تُسجَّل مهام');}
      else if(s){line=(s.mode==="study"&&s.newR?'حفظ: '+esc(labG(s.newR[0],s.newR[1])):'مراجعة فقط')+' · نحو '+n(Math.round(s.min))+' د';}
      h+='<a class="pl-task" href="#/plan/day/'+d+'"'+(d===T?' style="border:2px solid var(--gold2)"':'')+'><div class="tt"><b>'+wdName(d)+' · '+n(new Date(d+"T00:00:00Z").getUTCDate())+'</b>'+(d===T?'<span class="pill gold">اليوم</span>':(sdv.indexOf("ok")>=0?'<span class="pill">تم ✓</span>':sdv.indexOf("miss")>=0?'<span class="pill bad">فائت</span>':''))+'</div><div class="pl-note">'+line+'</div></a>';}
  }else{
    const base=new Date(T+"T00:00:00Z");base.setUTCMonth(base.getUTCMonth()+calS.mo,1);
    const first=base.toISOString().slice(0,10),y=base.getUTCFullYear(),mth=base.getUTCMonth();
    const dim=new Date(Date.UTC(y,mth+1,0)).getUTCDate();
    const lead=(wdOf(first)+1)%7;
    h+='<div class="row sp" style="margin-bottom:10px"><button class="btn soft sm" id="cmP">‹</button><b>'+new Intl.DateTimeFormat("ar-EG",{month:"long",year:"numeric",timeZone:"UTC"}).format(base)+'</b><button class="btn soft sm" id="cmN">›</button></div>';
    h+='<div class="pl-mon">'+WEEK_ORDER.map(w=>'<div class="pl-hd">'+WD_NAMES[w].replace("ال","")+'</div>').join("");
    for(let i=0;i<lead;i++)h+='<div class="pl-d none"></div>';
    for(let dd=1;dd<=dim;dd++){const d=new Date(Date.UTC(y,mth,dd)).toISOString().slice(0,10);h+='<a class="pl-d '+dayState(p,d,sim)+'" href="#/plan/day/'+d+'"><b>'+n(dd)+'</b></a>';}
    h+='</div><p class="pl-note" style="margin-top:10px">أخضر: تم · أصفر: ناقص · أحمر: فائت · أبيض: مخطَّط · رمادي: يوم مراجعة فقط. التوقعات تتغير حسب أدائك.</p>';
  }
  view.innerHTML=shell("calendar",h);
  $$(".tabs button").forEach(b=>b.onclick=()=>{calS.mode=b.dataset.m;pgCalendar();});
  const on=(i,f)=>{const e=$(i);e&&(e.onclick=f);};
  on("#cwP",()=>{calS.wo--;pgCalendar();});on("#cwN",()=>{calS.wo++;pgCalendar();});on("#cmP",()=>{calS.mo--;pgCalendar();});on("#cmN",()=>{calS.mo++;pgCalendar();});
}
/* ===== الإحصائيات ===== */
function pgStats(){
  const p=P.PL();const S=P.statsOf(p),T=tdy();
  let h='<h1>إحصائيات التقدّم</h1>';
  h+='<div class="card"><div class="pl-stat" style="grid-template-columns:repeat(2,1fr)"><div><b>'+n(S.juz)+'</b><span>أجزاء محفوظة كاملة</span></div><div><b>'+n(S.surahs)+'</b><span>سور محفوظة كاملة</span></div><div><b>'+n(S.ay)+'</b><span>آيات محفوظة</span></div><div><b>'+n(S.pages)+'</b><span>صفحات محفوظة كاملة</span></div><div><b>'+n(S.mastery)+'٪</b><span>نسبة إتقان المحفوظ</span></div><div><b>'+n(S.revs)+'</b><span>جلسات المراجعة</span></div></div></div>';
  h+='<div class="card"><h2>الالتزام</h2><div class="pl-bar"><i style="width:'+S.adherence+'%"></i></div><p class="pl-note" style="margin:6px 0 0">أنجزتِ شيئًا في '+n(S.active)+' من آخر '+n(S.planned)+' يومًا ('+n(S.adherence)+'٪)</p>';
  const days=[];for(let i=13;i>=0;i--){const d=addDays(T,-i);const L=p.log[d];let m=0;if(L&&L.t)Object.keys(L.t).forEach(k=>{m+=L.t[k].min||0;});days.push({d,m});}
  const mx=Math.max(10,...days.map(x=>x.m));
  h+='<div class="pl-chart">'+days.map(x=>'<i class="'+(x.m?"":"z")+'" style="height:'+Math.max(3,Math.round(x.m/mx*100))+'%" title="'+x.d+' : '+Math.round(x.m)+' د"></i>').join("")+'</div><p class="pl-note" style="margin:4px 0 0">دقائق الإنجاز في آخر ١٤ يومًا</p></div>';
  h+='<div class="card"><h2>سور تحتاج مراجعة</h2>'+(S.need.length?S.need.map(o=>'<a class="pl-task" href="#/quran/'+o.s+'" style="padding:10px 14px"><div class="tt"><b>'+SN[o.s-1]+'</b><span class="pill'+(o.m<70?" bad":"")+'">إتقان '+n(o.m)+'٪'+(o.over?' · متأخرة '+n(o.over)+' يوم':'')+'</span></div></a>').join(""):'<p class="muted">لا يوجد محفوظ مسجَّل بعد.</p>')+'</div>';
  h+='<div class="card"><h2>آيات تتكرر فيها الأخطاء</h2>'+(S.errs.length?S.errs.map(e=>{const f=fromGi(e.g);return '<a class="pl-task" href="#/quran/r/'+e.g+'/'+e.g+'" style="padding:10px 14px"><div class="tt"><b>'+SN[f.s-1]+' · آية '+n(f.a)+'</b><span class="pill bad">'+n(e.c)+' مرة</span></div><div class="quran" style="font-size:19px;line-height:2">'+esc(ayahText(f.s,f.a))+'</div></a>';}).join(""):'<p class="muted">لا أخطاء مسجَّلة. ما شاء الله.</p>')+'</div>';
  // سجل شهري
  const months={};Object.keys(p.log).forEach(d=>{const L=p.log[d];const mk=d.slice(0,7);const o=months[mk]||(months[mk]={days:0,ay:0,rev:0});if(L.t&&Object.keys(L.t).length)o.days++;if(L.new&&L.new.done)o.ay+=L.new.r[1]-L.new.r[0]+1;if(L.t)Object.keys(L.t).forEach(k=>{if(L.t[k].type!=="new"&&L.t[k].type!=="new2")o.rev++;});});
  const ml=Object.keys(months).sort().reverse().slice(0,6);
  h+='<div class="card"><h2>السجل الشهري</h2>'+(ml.length?ml.map(k=>'<div class="row sp" style="padding:6px 0;border-bottom:1px dashed var(--line)"><b>'+new Intl.DateTimeFormat("ar-EG",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(k+"-01T00:00:00Z"))+'</b><span class="pl-note">'+n(months[k].days)+' يومًا · حفظ '+n(months[k].ay)+' آية · '+n(months[k].rev)+' مراجعة</span></div>').join(""):'<p class="muted">يبدأ السجل بعد أول إنجاز.</p>')+'</div>';
  const dl=Object.keys(p.log).filter(d=>p.log[d].t&&Object.keys(p.log[d].t).length).sort().reverse().slice(0,14);
  h+='<div class="card"><h2>السجل اليومي</h2>'+(dl.length?dl.map(d=>{const L=p.log[d];const ks=Object.keys(L.t);const sc=ks.map(k=>L.t[k].score).filter(x=>x!=null);const av=sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):0;return '<a class="row sp" style="padding:8px 0;border-bottom:1px dashed var(--line);text-decoration:none;color:inherit" href="#/plan/day/'+d+'"><b>'+dateAr(d,{weekday:"short"})+'</b><span class="pl-note">'+n(ks.length)+' مهام · متوسط '+n(av)+'٪</span></a>';}).join(""):'<p class="muted">يبدأ السجل بعد أول إنجاز.</p>')+'</div>';
  view.innerHTML=shell("stats",h);
}
/* ===== الطرق والمصادر ===== */
const SRC={
 alagme:["مؤسسة العجمي: طريقة السبق والسبقي والمنزل","https://alagme.com/blog/hifz-sabaq-sabqi-manzil-method/"],
 halaqa:["حلقة: جدول مراجعة القرآن","https://7alaqa.com/guides/revision-schedule"],
 tilawa:["Tilawa: مراجعة حفظ القرآن، الجديد والقريب والبعيد","https://tilawa.ai/ar/learn/memorize-quran/revision/"],
 hefz:["الحفظ الميسر: كيف نحفظ القرآن الكريم","https://hefzmoyaser.com/memorizingHow"],
 awqaf:["إدارة الدراسات الإسلامية بالكويت: قواعد ذهبية في حفظ الآيات","https://douralquran.awqaf.gov.kw/ar/%D9%85%D9%88%D8%A7%D8%B6%D9%8A%D8%B9%20%D8%AA%D9%87%D9%85%D9%83/%D9%82%D9%88%D8%A7%D8%B9%D8%AF-%D8%B0%D9%87%D8%A8%D9%8A%D8%A9-%D9%81%D9%8A-%D8%AD%D9%81%D8%B8-%D8%A7%D9%84%D8%A2%D9%8A%D8%A7%D8%AA-%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%D9%8A%D8%A9-6827"],
 spaced:["Spaced repetition (Wikipedia)","https://en.wikipedia.org/wiki/Spaced_repetition"],
 leitner:["Leitner system (Wikipedia)","https://en.wikipedia.org/wiki/Leitner_system"]
};
const srcLinks=ks=>'<div class="pl-src"><b style="font-size:13px">المصادر:</b>'+ks.map(k=>'<a href="'+SRC[k][1]+'" target="_blank" rel="noopener">'+SRC[k][0]+' ↗</a>').join("")+'</div>';
function pgMethods(){
  let h='<h1>طرق الحفظ والمراجعة</h1><div class="card"><p style="margin:0">لم نخترع طريقة. ما يلي طرق معروفة في حلقات التحفيظ ومدارسه، مأخوذة من المصادر المذكورة تحت كل طريقة. الأرقام الافتراضية داخل التطبيق (عدد مرات الاستماع وفترات المراجعة) ضبطٌ للتطبيق مبنيٌّ على هذه الطرق، ولا ننسبه إلى شيخ أو جهة بعينها. كل رقم منها قابل للتعديل من الإعدادات.</p></div>';
  h+='<h2 style="margin:18px 4px 8px">نماذج الخطة</h2>';
  h+='<div class="card"><h3>١. الجديد والقريب والبعيد (السبق والسبقي والمنزل)</h3><p><b>آلية العمل:</b> ثلاثة أجزاء كل يوم: الحفظ الجديد (السبق)، ومراجعة المحفوظ القريب (السبقي)، ومراجعة المحفوظ القديم كله على دورة (المنزل).</p><p><b>التوزيع في التطبيق:</b> المقطع الجديد يُراجع يوميًا في أول أسبوع، ثم يدخل دورة المراجعة البعيدة (٧ إلى ٣٠ يومًا بحسب حجم المحفوظ). إذا قصّرتِ في تسميعه رجع إلى المراجعة القريبة.</p><p><b>المميزات:</b> بسيط وواضح، ويمنع نسيان القديم لأنه يُراجع دوريًا، والجديد يُختبر قبل أن يدخل المنزل.</p><p><b>يناسب:</b> من يريد نظامًا ثابتًا ومعتادًا في الحلقات. وعند ضيق الوقت يُخفَّف الجديد ولا يُترك المنزل.</p>'+srcLinks(["alagme","halaqa","tilawa"])+'</div>';
  h+='<div class="card"><h3>٢. المراجعة المتباعدة التكيفية</h3><p><b>آلية العمل:</b> كل مقطع محفوظ له موعد مراجعة خاص به. إذا سمّعتِه بإتقان تباعد الموعد (١، ٢، ٤، ٧، ١٤، ٣٠ ثم ٦٠ ثم ٩٠ يومًا)، وإذا أخطأتِ قصر الموعد وعاد المقطع أسرع.</p><p><b>المميزات:</b> تكرار المراجعة يتناسب مع إتقانك لكل مقطع، فلا يأخذ المتقن وقتًا يحتاجه الضعيف.</p><p><b>يناسب:</b> من يحفظ بكميات كبيرة ويريد توفير وقت المراجعة. والمبدأ العام (المراجعة على فترات متباعدة تثبّت المحفوظ) معروف في علم التعلّم باسم التكرار المتباعد، وليس خاصًّا بالقرآن.</p>'+srcLinks(["spaced","leitner","halaqa"])+'</div>';
  h+='<div class="card"><h3>٣. المراجعة التراكمية مع يوم مراجعة أسبوعي</h3><p><b>آلية العمل:</b> يراجع الحافظ كل يوم ما حفظه من السورة الحالية من أولها (بحدّ أقصى عشر صفحات)، ويُخصَّص يوم في الأسبوع للمراجعة فقط بلا حفظ جديد، وتُصفَّى فيه المراجعات المتراكمة.</p><p><b>المميزات:</b> تربط المقاطع المحفوظة ببعضها فتتماسك السورة، ويوم الراحة من الجديد يمنع تراكم المراجعة.</p><p><b>يناسب:</b> كبار السن، ومن يشكو من كثرة النسيان، ومن يحفظ السور الطوال.</p>'+srcLinks(["hefz","halaqa"])+'</div>';
  h+='<h2 style="margin:18px 4px 8px">طرق الحفظ (لوضع «احفظ معي»)</h2>';
  h+='<div class="card"><h3>الحفظ التسلسلي</h3><p>تحفظين الآية الأولى بتكرارها حتى تثبت، ثم تسمّعينها، ثم الثانية كذلك، ثم تسمّعين الآيتين معًا ثلاث مرات على الأقل، وهكذا حتى نهاية الورد، ثم تقرئينه من المصحف خمس مرات وتسمّعينه خمسًا. يربط الآيات ببعضها، ويراه المصدر من أفضل الطرق.</p>'+srcLinks(["hefz"])+'</div>';
  h+='<div class="card"><h3>الحفظ التجميعي</h3><p>تحفظين كل آية وحدها دون ربط، ثم بعد الانتهاء تقرئين الورد من المصحف وتسمّعينه. أسرع وأوفر للوقت، لكنه أضعف لأن آية قد تسقط دون أن تنتبهي، ولا يُنصح به للمبتدئ.</p>'+srcLinks(["hefz"])+'</div>';
  h+='<div class="card"><h3>الحفظ المقسَّم</h3><p>تحددين عدة آيات متقاربة المعنى وتقرئين تفسيرها المختصر، ثم تكررينها وتسمّعينها، وفي اليوم التالي تراجعين من أول السورة قبل الجديد. يناسب كبار السن ومن يشكو كثرة النسيان.</p>'+srcLinks(["hefz"])+'</div>';
  h+='<div class="card"><h3>الحفظ التقليدي</h3><p>تكرار الورد اليومي كاملًا عشرين مرة تقريبًا، ثم قراءته من المصحف خمسًا وتسميعه خمسًا. يناسب الصغار سريعي الحفظ ويحتاج تركيزًا شديدًا.</p>'+srcLinks(["hefz"])+'</div>';
  h+='<div class="card"><h3>أصول عامة</h3><p>سماع الآيات من قارئ متقن ثم الترديد خلفه ثم الاستماع مرة أخرى قبل التسميع، وتحديد مقدار يومي ثابت، والتسميع على معلّم أو بصوتك في التطبيق لاكتشاف الأخطاء مبكرًا.</p>'+srcLinks(["awqaf","hefz"])+'<p class="pl-note" style="margin-bottom:0">التسميع في التطبيق يكشف المواضع الخاطئة لكنه لا يغني عن عرض الحفظ على معلّم متقن.</p></div>';
  view.innerHTML=shell("methods",h);
}
/* ===== معالج الإنشاء والإعدادات ===== */
function pgSetup(edit){
  const old=P.PL();
  const W=edit?JSON.parse(JSON.stringify(old.cfg)):P.defaultCfg();
  W.priorSurahs=W.priorSurahs||[];
  const hasOld=!edit&&ST.hifz&&ST.hifz.segs&&ST.hifz.segs.length;
  const amt=[["a3","٣ آيات","ayat",3],["a5","٥ آيات","ayat",5],["a10","١٠ آيات","ayat",10],["half","نصف صفحة","half"],["page","صفحة","page"],["pages2","صفحتان","pages2"],["juz","جزء","juz"],["custom","مقدار مخصص","pagesx"]];
  const curAmt=()=>{if(W.unit==="ayat"&&[3,5,10].includes(W.val))return "a"+W.val;if(["half","page","pages2","juz"].includes(W.unit))return W.unit;return "custom";};
  const dayOrder=WEEK_ORDER;
  let h='<h1>'+(edit?"إعدادات الخطة":"خطتي لحفظ القرآن الكريم")+'</h1>';
  if(!edit)h+='<div class="card"><p style="margin:0">خطة حفظ ومراجعة تُبنى على طرق معروفة عند أهل القرآن، وتتكيف مع أدائك. أجيبي عن الأسئلة التالية وسنحسب لك خطة واقعية.</p></div>';
  if(!edit){
    h+='<div class="card"><h2>١. من أين تبدئين؟</h2><div class="pl-chips" id="sMode"><button class="pl-chip" data-v="first">من أول المصحف</button><button class="pl-chip" data-v="surah">من سورة معيّنة</button></div>'
     +'<div id="sSurahBox" style="display:none"><div class="grid2"><div><label class="f">السورة</label><select id="sS">'+SN.map((x,i)=>'<option value="'+(i+1)+'">'+n(i+1)+'. '+x+'</option>').join("")+'</select></div><div><label class="f">من الآية</label><input type="number" id="sA" min="1" value="1"></div></div></div>'
     +'<label class="f">ترتيب الحفظ</label><select id="sDir"><option value="fwd">من السورة المحددة إلى آخر المصحف</option><option value="back">عكسيًا: من السورة المحددة نزولًا إلى الفاتحة</option></select></div>';
    h+='<div class="card"><h2>٢. ما الذي حفظتِه من قبل؟</h2><div id="sPrior">'
     +'<label class="pl-opt" data-v="none"><b>لم أحفظ شيئًا</b></label>'
     +'<label class="pl-opt" data-v="upto"><b>حفظت من بداية خطتي حتى نقطة معيّنة</b></label>'
     +'<label class="pl-opt" data-v="pick"><b>أختار السور والأجزاء المحفوظة</b></label>'
     +(hasOld?'<label class="pl-opt" data-v="old"><b>استيراد المحفوظ من خطة الحفظ السابقة</b><span class="pl-note">'+n(ST.hifz.segs.length)+' مقطع بتقدّمه ومواعيد مراجعته</span></label>':'')
     +'</div><div id="sUpto" style="display:none"><div class="grid2"><div><label class="f">وصلت إلى سورة</label><select id="sPS">'+SN.map((x,i)=>'<option value="'+(i+1)+'">'+n(i+1)+'. '+x+'</option>').join("")+'</select></div><div><label class="f">حتى الآية (تشمل)</label><input type="number" id="sPA" min="1" value="1"></div></div></div>'
     +'<div id="sPick" style="display:none"><div class="row" style="margin:8px 0"><select id="sPJ" style="width:auto;flex:1"><option value="">إضافة جزء كامل…</option>'+JUZ.map((j,i)=>'<option value="'+i+'">الجزء '+n(i+1)+'</option>').join("")+'</select></div><div class="list" id="sPL" style="max-height:260px;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:6px">'+SN.map((x,i)=>'<label class="sr"><input type="checkbox" value="'+(i+1)+'"><span>'+x+'</span></label>').join("")+'</div><p class="pl-note">المحفوظ سابقًا يدخل جدول المراجعة موزَّعًا على الأيام القادمة.</p></div></div>';
  }
  h+='<div class="card"><h2>'+(edit?"١":"٣")+'. مقدار الحفظ الجديد يوميًا</h2><div class="pl-chips" id="sAmt">'+amt.map(a=>'<button class="pl-chip" data-v="'+a[0]+'">'+a[1]+'</button>').join("")+'</div><div id="sCust" style="display:none"><div class="grid2"><div><label class="f">المقدار</label><input type="number" id="sCV" min="1" step="0.5" value="'+(W.unit==="pagesx"?W.val:(W.unit==="ayat"?W.val:2))+'"></div><div><label class="f">الوحدة</label><select id="sCU"><option value="ayat">آيات</option><option value="pagesx">صفحات</option></select></div></div></div></div>';
  h+='<div class="card"><h2>'+(edit?"٢":"٤")+'. أيام الحفظ الأسبوعية</h2><div class="pl-chips" id="sDays">'+dayOrder.map(d=>'<button class="pl-chip" data-v="'+d+'">'+WD_NAMES[d]+'</button>').join("")+'</div><p class="pl-note" style="margin:6px 0 0">أيام الحفظ الجديد. المراجعة تكون كل يوم.</p><label class="f">يوم مراجعة بلا حفظ جديد</label><select id="sRev"><option value="-1">بدون</option>'+dayOrder.map(d=>'<option value="'+d+'">'+WD_NAMES[d]+'</option>').join("")+'</select></div>';
  h+='<div class="card"><h2>'+(edit?"٣":"٥")+'. المدة المستهدفة لختم القرآن حفظًا</h2><select id="sTg"><option value="0">بدون مدة، حسب مقدار الورد</option>'+[[6,"٦ أشهر"],[12,"سنة"],[18,"سنة ونصف"],[24,"سنتان"],[36,"٣ سنوات"],[60,"٥ سنوات"]].map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join("")+'</select></div>';
  h+='<div class="card"><h2>'+(edit?"٤":"٦")+'. مستواك والوقت المتاح</h2><div class="pl-chips" id="sLv">'+Object.keys(LV).map(k=>'<button class="pl-chip" data-v="'+k+'">'+LV[k].name+'</button>').join("")+'</div><label class="f">الوقت المتاح يوميًا للحفظ والمراجعة معًا: <b id="sMinV"></b></label><input type="range" id="sMin" min="15" max="240" step="5"></div>';
  h+='<div class="card"><h2>'+(edit?"٥":"٧")+'. نموذج الخطة</h2><div id="sModel">'+Object.keys(MODELS).map(k=>'<label class="pl-opt" data-v="'+k+'"><b>'+MODELS[k].n+'</b><span class="pl-note">'+MODELS[k].s+'</span></label>').join("")+'</div><a href="#/plan/methods" class="pl-note" style="color:var(--g7)">تفاصيل كل نموذج ومصادره ↗</a>'
   +'<label class="f">طريقة الحفظ المفضلة (لوضع «احفظ معي»)</label><select id="sMeth">'+Object.keys(METHODS_MEM).map(k=>'<option value="'+k+'">'+METHODS_MEM[k]+'</option>').join("")+'</select>'
   +'<label class="f">القارئ</label><select id="sRec">'+RECITERS.map(r=>'<option value="'+r[0]+'">'+r[1]+'</option>').join("")+'</select></div>';
  h+='<div class="card pl-sum" id="sSum"></div>';
  h+='<div class="row" style="margin-bottom:14px"><button class="btn gold" id="sGo">'+(edit?"حفظ التعديلات":"ابدئي الخطة")+'</button>'+(edit?'<a class="btn ghost" style="text-decoration:none" href="#/plan/settings">رجوع</a>':'')+'</div>';
  if(edit)view.innerHTML=h;else view.innerHTML=h;
  // ربط القيم
  const setOn=(sel,attr,val)=>$$(sel).forEach(b=>b.classList.toggle("on",String(b.dataset[attr||"v"])===String(val)));
  let prior=W.prior||"none";
  const imp=()=>{
    if(edit)return null;
    if(prior==="old")return{segs:ST.hifz.segs.map(g=>({s:g.s,a:g.a,b:g.b,idx:g.idx,next:g.next,last:g.last,n:g.n,date:g.date}))};
    const ranges=[];
    if(prior==="upto"){
      const target=+$("#sPS").value,ta=Math.max(1,Math.min(SC[target-1],+$("#sPA").value||1));
      const order=P.orderSurahs(W);const gs=OFF[W.startS-1]+(W.startMode==="surah"?(W.startA-1):0);
      for(const s of order){const g0=OFF[s-1],g1=g0+SC[s-1]-1;
        let a=g0,b=g1;if(s===W.startS&&W.startMode==="surah")a=OFF[s-1]+W.startA-1;
        if(s===target){b=OFF[s-1]+ta-1;if(b>=a)ranges.push([a,b]);break;}
        if(b>=a)ranges.push([a,b]);}
    }else if(prior==="pick"){
      $$("#sPL input:checked").forEach(c=>{const s=+c.value;ranges.push([OFF[s-1],OFF[s-1]+SC[s-1]-1]);});
    }
    return{ranges};
  };
  const sync=()=>{
    if(!edit){setOn("#sMode .pl-chip","v",W.startMode);$("#sSurahBox").style.display=W.startMode==="surah"?"":"none";
      $$("#sPrior .pl-opt").forEach(o=>o.classList.toggle("on",o.dataset.v===prior));
      $("#sUpto").style.display=prior==="upto"?"":"none";$("#sPick").style.display=prior==="pick"?"":"none";}
    setOn("#sAmt .pl-chip","v",curAmt());$("#sCust").style.display=curAmt()==="custom"?"":"none";
    $$("#sDays .pl-chip").forEach(b=>b.classList.toggle("on",W.days.includes(+b.dataset.v)));
    setOn("#sLv .pl-chip","v",W.level);$$("#sModel .pl-opt").forEach(o=>o.classList.toggle("on",o.dataset.v===W.model));
    $("#sMinV").textContent=fmtMin(W.mins);
    summary();
  };
  const summary=()=>{
    const el=$("#sSum");
    if(!W.days.length){el.innerHTML='<b>اختاري يومًا واحدًا على الأقل للحفظ.</b>';return;}
    const ww=JSON.parse(JSON.stringify(W));
    let tp;try{tp=edit?(function(){const c=JSON.parse(JSON.stringify(old));c.cfg=ww;c.ver=(c.ver||0)+1;delete c.log[tdy()];return c;})():P.createPlan(ww,imp(),true);}catch(e){el.innerHTML="";return;}
    const np=P.nextPortion(tp,1);
    const day=P.buildDay(tp,tdy(),{sim:true});
    const fin=P.projectFinish(tp);
    const nt=day.tasks.find(t=>t.type==="new");
    const totMin=day.tasks.reduce((s,t)=>s+t.min,0);
    let m='<h2 style="margin-bottom:6px">ملخص خطتك</h2>';
    if(!np)m+='<p>لا يوجد حفظ جديد متبقٍّ في هذه الخطة.</p>';
    else{
      m+='<p style="margin:0 0 6px">أول ورد جديد: <b>'+esc(labG(np.g0,np.g1))+'</b> ('+n(np.g1-np.g0+1)+' آية، '+pgTxt(np.w)+')</p>';
      m+='<p style="margin:0 0 6px">المتبقي للحفظ: <b>'+n(P.remainingAyat(tp))+'</b> آية (نحو '+n(Math.round(P.remainingWords(tp)/PAGE_W))+' صفحة)</p>';
      m+='<p style="margin:0 0 6px">الوقت التقديري لأول يوم: نحو <b>'+fmtMin(totMin)+'</b> من '+fmtMin(W.mins)+' متاحة</p>';
      const yrs=fin.days/30.4;
      m+='<p style="margin:0 0 6px">بهذا المقدار يُتوقَّع إتمام الحفظ في: <b>'+fmtDate(fin.date)+'</b> (نحو '+(yrs>=1.5?n(Math.round(yrs*10)/10)+' سنة':n(Math.round(fin.days/30.4))+' شهرًا')+')</p>';
      const warns=[];
      if(totMin>W.mins*1.1)warns.push('الخطة تحتاج وقتًا أكثر من المتاح. سنقدّم الأهم ونؤجّل الباقي تلقائيًا، أو قلّلي مقدار الحفظ الجديد.');
      if(W.target>0){const tdays=Math.round(W.target*30.4),remW=P.remainingWords(tp);const nd=Math.max(1,W.days.filter(d=>d!==W.revDay).length);const need=remW/(tdays*nd/7)/PAGE_W;
        if(fin.days>tdays*1.03){warns.push('لتختمي حفظًا خلال '+n(W.target)+' شهرًا تحتاجين نحو <b>'+n(Math.ceil(need*4)/4)+'</b> صفحة في كل يوم حفظ. مقدارك الحالي لن يبلغ الهدف.');}
        else m+='<p style="margin:0 0 6px;color:var(--ok)"><b>مقدارك الحالي يبلغ هدفك في المدة المحددة.</b></p>';}
      const cap=(W.mins*.5)/(PAGE_W*LV[W.level].nw);
      if(pagesOf(np.w)>cap*1.25)warns.push('مقدار الحفظ الجديد كبير على وقتك المتاح. المناسب لوقتك ومستواك نحو '+n(Math.max(0.25,Math.floor(cap*4)/4))+' صفحة يوميًا.');
      if(warns.length)m+='<div class="card pl-warn" style="margin:8px 0 0;padding:12px">'+warns.map(x=>'<p style="margin:0 0 4px">'+x+'</p>').join("")+'</div>';
    }
    el.innerHTML=m;
  };
  if(!edit){
    $$("#sMode .pl-chip").forEach(b=>b.onclick=()=>{W.startMode=b.dataset.v;if(W.startMode==="first"){W.startS=1;W.startA=1;}else{W.startS=+$("#sS").value;W.startA=+$("#sA").value||1;}sync();});
    $("#sS").onchange=()=>{W.startS=+$("#sS").value;$("#sA").max=SC[W.startS-1];$("#sA").value=1;W.startA=1;sync();};
    $("#sA").oninput=()=>{W.startA=Math.max(1,Math.min(SC[W.startS-1],+$("#sA").value||1));sync();};
    $("#sDir").onchange=()=>{W.dir=$("#sDir").value;sync();};
    $$("#sPrior .pl-opt").forEach(o=>o.onclick=()=>{prior=o.dataset.v;sync();});
    $("#sPS").onchange=()=>{$("#sPA").max=SC[+$("#sPS").value-1];sync();};
    $("#sPA").oninput=sync;
    $$("#sPL input").forEach(c=>c.onchange=sync);
    $("#sPJ").onchange=()=>{const v=$("#sPJ").value;if(v==="")return;const j=+v,a=JUZ_GI[j],b=j<29?JUZ_GI[j+1]-1:TOTAL-1;const set=new Set();for(let g=a;g<=b;g++)set.add(fromGi(g).s);
      // نحدد السور التي يغطيها الجزء كاملة فقط، ويُنبَّه المستخدم للسور الجزئية
      let part=0;set.forEach(s=>{const s0=OFF[s-1],s1=s0+SC[s-1]-1;if(s0>=a&&s1<=b){const cb=$("#sPL input[value='"+s+"']");if(cb)cb.checked=true;}else part++;});
      if(part)toast("السور التي تمتد بين جزأين لم تُحدَّد تلقائيًا، حدّديها بنفسك عند الحاجة.");$("#sPJ").value="";sync();};
    $("#sS").value=W.startS;
  }
  $$("#sAmt .pl-chip").forEach(b=>b.onclick=()=>{const a=amt.find(x=>x[0]===b.dataset.v);if(a[0]==="custom"){W.unit="pagesx";W.val=+$("#sCV").value||1;$("#sCU").value="pagesx";}else{W.unit=a[2];if(a[3])W.val=a[3];}sync();});
  const custUpd=()=>{const v=Math.max(0.25,+$("#sCV").value||1),u=$("#sCU").value;W.unit=u==="ayat"?"ayat":"pagesx";W.val=u==="ayat"?Math.max(1,Math.round(v)):v;sync();};
  $("#sCV").oninput=custUpd;$("#sCU").onchange=custUpd;if(W.unit==="ayat"&&![3,5,10].includes(W.val))$("#sCU").value="ayat";else if(W.unit==="pagesx")$("#sCU").value="pagesx";
  $$("#sDays .pl-chip").forEach(b=>b.onclick=()=>{const d=+b.dataset.v;const i=W.days.indexOf(d);if(i>=0)W.days.splice(i,1);else W.days.push(d);sync();});
  $("#sRev").value=W.revDay;$("#sRev").onchange=()=>{W.revDay=+$("#sRev").value;sync();};
  $("#sTg").value=W.target;$("#sTg").onchange=()=>{W.target=+$("#sTg").value;sync();};
  $$("#sLv .pl-chip").forEach(b=>b.onclick=()=>{W.level=b.dataset.v;sync();});
  $("#sMin").value=W.mins;$("#sMin").oninput=()=>{W.mins=+$("#sMin").value;sync();};
  $$("#sModel .pl-opt").forEach(o=>o.onclick=()=>{W.model=o.dataset.v;W.revDay=MODELS[W.model].rev>=0&&!edit?MODELS[W.model].rev:W.revDay;$("#sRev").value=W.revDay;sync();});
  $("#sMeth").value=W.method;$("#sMeth").onchange=()=>{W.method=$("#sMeth").value;};
  $("#sRec").value=W.reciter;$("#sRec").onchange=()=>{W.reciter=$("#sRec").value;};
  sync();
  $("#sGo").onclick=()=>{
    if(!W.days.length){toast("اختاري يومًا واحدًا على الأقل");return;}
    if(edit){const p=P.PL();Object.assign(p.cfg,{unit:W.unit,val:W.val,days:W.days,revDay:W.revDay,target:W.target,level:W.level,mins:W.mins,model:W.model,method:W.method,reciter:W.reciter});p.hist.push({d:tdy(),ev:"edit"});clearFrozen(p);P.bump(p);save();toast("تم حفظ التعديلات");location.hash="#/plan";pgDash();return;}
    if(W.startMode==="surah"){W.startS=+$("#sS").value;W.startA=Math.max(1,Math.min(SC[W.startS-1],+$("#sA").value||1));}
    W.prior=prior;
    P.createPlan(W,imp(),false);toast("تم إنشاء خطتك");location.hash="#/plan";pgDash();
  };
}
/* ===== الإعدادات ===== */
function pgSettings(){
  const p=P.PL();
  if(!p)return pgSetup(false);
  const c=p.cfg;
  let h='<h1>إعدادات الخطة</h1>';
  h+='<div class="card"><div class="row sp"><div><b>الحالة: '+(p.st==="paused"?"متوقفة مؤقتًا":"فعّالة")+'</b><div class="pl-note">بدأت في '+fmtDate(p.created)+'</div></div>'+(p.st==="paused"?'<button class="btn gold" id="stRes">استئناف</button>':'<button class="btn soft" id="stPause">إيقاف مؤقت</button>')+'</div><p class="pl-note" style="margin:8px 0 0">الإيقاف لا يفقد تقدّمك، وعند الاستئناف تُؤجَّل مواعيد المراجعة بمقدار مدة التوقف.</p></div>';
  h+='<div class="card"><h2>الخطة الحالية</h2><p style="margin:0 0 6px">المقدار: <b>'+esc(amountLabel(c))+'</b></p><p style="margin:0 0 6px">أيام الحفظ: <b>'+c.days.map(d=>WD_NAMES[d]).join("، ")+'</b></p><p style="margin:0 0 6px">النموذج: <b>'+MODELS[c.model].n+'</b></p><p style="margin:0 0 6px">الوقت اليومي: <b>'+fmtMin(c.mins)+'</b> · المستوى: <b>'+LV[c.level].name+'</b></p><a class="btn" style="text-decoration:none" href="#/plan/edit">تعديل الخطة</a></div>';
  h+='<div class="card"><h2>مراجعة اليوم فقط</h2><p class="muted" style="margin-top:0">إن كان اليوم مزدحمًا يمكنك تحويله إلى يوم مراجعة بلا حفظ جديد. يبقى الورد الجديد كما هو لليوم التالي.</p><button class="btn soft" id="stRevOnly">اجعلي اليوم مراجعة فقط</button></div>';
  h+='<div class="card"><h2>القارئ المفضّل للخطة</h2><select id="stRec">'+RECITERS.map(r=>'<option value="'+r[0]+'"'+(c.reciter===r[0]?" selected":"")+'>'+r[1]+'</option>').join("")+'</select></div>';
  h+='<div class="card"><h2>بدء خطة جديدة</h2><p class="muted" style="margin-top:0">يحذف الخطة الحالية وتقدّمها فقط. لا يمس خطة الحفظ السابقة ولا سجل التسميع.</p><button class="btn bad" id="stReset">حذف الخطة الحالية وتقدّمها</button></div>';
  view.innerHTML=shell("settings",h);
  const on=(i,f)=>{const e=$(i);e&&(e.onclick=f);};
  on("#stPause",()=>{if(confirm("إيقاف الخطة مؤقتًا؟ تقدّمك محفوظ.")){p.st="paused";p.pausedAt=tdy();p.hist.push({d:tdy(),ev:"pause"});save();pgSettings();}});
  on("#stRes",resumePlan);
  on("#stRevOnly",()=>{const T=tdy();const L=p.log[T]=p.log[T]||{t:{}};if(L.new&&L.new.done){toast("حفظتِ جديدًا اليوم بالفعل.");return;}L.mode="revonly";L.newR=null;L.reason="جعلتِ اليوم للمراجعة فقط. يبقى الورد الجديد لغد.";save();location.hash="#/plan";pgDash();});
  $("#stRec").onchange=()=>{c.reciter=$("#stRec").value;save();toast("تم");};
  on("#stReset",()=>{if(confirm("سيتم حذف الخطة الحالية وتقدّمها. متأكدة؟")){ST.plan=null;save();location.hash="#/plan/setup";pgSetup(false);}});
}
function amountLabel(c){switch(c.unit){case"ayat":return n(c.val)+" آيات";case"half":return "نصف صفحة";case"page":return "صفحة";case"pages2":return "صفحتان";case"juz":return "جزء";default:return n(c.val)+" صفحة";}}
const oldPgPlan=pgPlan;
window.pgPlan=function(parts){if(parts[0]==="edit"){if(!P.PL())return pgSetup(false);return pgSetup(true);}return oldPgPlan(parts);};
window.planAmountLabel=amountLabel;
/* ===== بطاقات الدخول ===== */
window.planHomeCard=function(){
  const p=P.PL();const v=document.getElementById("app");if(!v)return;
  const c=document.createElement("div");
  if(!p){c.className="card pl-banner";c.innerHTML='<div><b>خطتي لحفظ القرآن الكريم</b><div style="opacity:.85;font-size:14px">خطة حفظ ومراجعة ذكية تتكيف مع أدائك</div></div><a class="btn" style="text-decoration:none" href="#/plan">ابدئي الآن</a>';}
  else{const d=P.buildDay(p,tdy());c.className="card pl-banner";c.innerHTML='<div><b>خطتي لحفظ القرآن الكريم</b><div style="opacity:.85;font-size:14px">'+(d.paused?"الخطة متوقفة مؤقتًا":'إنجاز اليوم '+n(d.pct)+'٪ · متبقٍ نحو '+n(Math.round(d.remMin||0))+' دقيقة')+'</div></div><a class="btn" style="text-decoration:none" href="#/plan">'+(d.paused?"استئناف":"افتحي خطة اليوم")+'</a>';}
  v.insertBefore(c,v.firstChild);
};
window.planHifzBanner=function(){
  const v=document.getElementById("app");if(!v)return;const p=P.PL();
  const c=document.createElement("div");c.className="card pl-banner";
  c.innerHTML='<div><b>خطتي لحفظ القرآن الكريم</b><div style="opacity:.85;font-size:14px">النظام الجديد: خطة مخصصة، مراجعة ذكية، مصحف وتسميع في مكان واحد'+(p?"":" · لم تبدئي بعد")+'</div></div><a class="btn" style="text-decoration:none" href="#/plan">'+(p?"افتحي الخطة":"ابدئي الخطة")+'</a>';
  v.insertBefore(c,v.firstChild);
};
window.planMoreCard=function(){
  const v=document.getElementById("app");if(!v)return;
  const c=document.createElement("div");c.className="card row sp";c.innerHTML='<div><b>خطتي لحفظ القرآن الكريم</b><div class="muted">خطة حفظ ومراجعة ذكية</div></div><a class="btn sm" style="text-decoration:none" href="#/plan">افتحي</a>';
  const h1=v.querySelector("h1");if(h1&&h1.nextSibling)v.insertBefore(c,h1.nextSibling);else v.appendChild(c);
};
})();
/* احفظ معي */
(function(){
"use strict";
const P=window.PLAN,{labG,LV,METHODS_MEM,PAGE_W}=P;
let M=null;
function lvl(){const p=P.PL();return LV[(p&&p.cfg.level)||"m"];}
function buildSteps(g0,g1,method,lv){
  const R=lv.listen,steps=[];const ay=[];for(let g=g0;g<=g1;g++)ay.push(g);
  const L=(a,b,reps,t)=>steps.push({k:"listen",a,b,reps,t});
  const C=(a,b,reps,t)=>steps.push({k:"recite",a,b,reps,t});
  const RD=(a,b,reps,t)=>steps.push({k:"read",a,b,reps,t});
  if(method==="seq"){
    ay.forEach((g,i)=>{
      L(g,g,R,"استمعي إلى هذه الآية متابِعةً النص");
      RD(g,g,3,"اقرئيها مع القارئ بصوتك");
      C(g,g,3,"أخفي النص وسمّعيها من حفظك");
      if(i>0)C(ay[0],g,3,"اربطي: سمّعي من أول المقطع حتى هذه الآية");
    });
    RD(g0,g1,5,"اقرئي الورد كاملًا من المصحف");
    C(g0,g1,5,"سمّعي الورد كاملًا من غير نظر");
  }else if(method==="jam"){
    ay.forEach(g=>{L(g,g,R,"استمعي إلى الآية");C(g,g,3,"سمّعي الآية من حفظك");});
    RD(g0,g1,5,"اقرئي الورد كاملًا من المصحف");
    C(g0,g1,5,"سمّعي الورد كاملًا");
  }else if(method==="mq"){
    for(let i=0;i<ay.length;i+=5){const a=ay[i],b=ay[Math.min(ay.length-1,i+4)];
      steps.push({k:"tafsir",a,b,reps:1,t:"اقرئي تفسير هذا المقطع المختصر لتفهمي معناه"});
      L(a,b,R,"استمعي إلى المقطع");C(a,b,3,"سمّعي المقطع من حفظك");}
    C(g0,g1,3,"سمّعي الورد كاملًا");
  }else{
    L(g0,g1,Math.max(R,10)*2>40?40:Math.max(R,10)*2,"كرّري الورد كاملًا بالاستماع");
    RD(g0,g1,5,"اقرئيه من المصحف خمس مرات");
    C(g0,g1,5,"سمّعيه من غير نظر خمس مرات");
  }
  return steps;
}
function txt(a,b,hide){let h='<div class="quran pl-q'+(hide?" hide":"")+'" id="mTxt">';for(let g=a;g<=b;g++){const f=fromGi(g);h+='<span class="t">'+esc(ayahText(f.s,f.a))+'</span> <span class="an">﴿'+n(f.a)+'﴾</span> ';}return h+'</div>';}
function free(){
  const p=P.PL();
  view.innerHTML='<div class="row sp"><a class="btn soft sm" style="text-decoration:none" href="#/plan">‹ الخطة</a></div><h1>احفظ معي</h1><div class="card"><p class="muted" style="margin-top:0">اختاري الآيات التي تريدين حفظها، وسنقودك خطوة بخطوة: استماع، قراءة، إخفاء، تسميع، ثم ربط الآيات.</p><div class="grid2"><div><label class="f">السورة</label><select id="mS">'+SN.map((x,i)=>'<option value="'+(i+1)+'">'+n(i+1)+'. '+x+'</option>').join("")+'</select></div><div></div><div><label class="f">من آية</label><input type="number" id="mA" min="1" value="1"></div><div><label class="f">إلى آية</label><input type="number" id="mB" min="1" value="5"></div></div><label class="f">طريقة الحفظ</label><select id="mM">'+Object.keys(METHODS_MEM).map(k=>'<option value="'+k+'"'+(p&&p.cfg.method===k?" selected":"")+'>'+METHODS_MEM[k]+'</option>').join("")+'</select><label class="f">القارئ</label><select id="mR">'+RECITERS.map(r=>'<option value="'+r[0]+'"'+(p&&p.cfg.reciter===r[0]?" selected":"")+'>'+r[1]+'</option>').join("")+'</select><div style="height:12px"></div><button class="btn gold" id="mGo">ابدئي</button></div>';
  const fix=()=>{const s=+$("#mS").value;$("#mA").max=SC[s-1];$("#mB").max=SC[s-1];};
  $("#mS").onchange=()=>{fix();$("#mA").value=1;$("#mB").value=Math.min(5,SC[+$("#mS").value-1]);};fix();
  $("#mGo").onclick=()=>{const s=+$("#mS").value;let a=Math.max(1,Math.min(SC[s-1],+$("#mA").value||1)),b=Math.max(1,Math.min(SC[s-1],+$("#mB").value||a));if(b<a){const t=a;a=b;b=t;}
    if(p&&$("#mM").value!==p.cfg.method){p.cfg.method=$("#mM").value;save();}
    start(gi(s,a),gi(s,b),"",$("#mM").value,$("#mR").value);};
}
function start(g0,g1,key,method,reciter){
  const lv=lvl();
  M={g0,g1,key,method,reciter,steps:buildSteps(g0,g1,method,lv),i:0,c:0,shown:false};
  render();
}
function render(){
  const s=M.steps[M.i];
  if(!s){return finish();}
  const done=M.c;const name={listen:"استماع",read:"قراءة مع الاستماع",recite:"تسميع من الحفظ",tafsir:"فهم المعنى"}[s.k];
  const hide=s.k==="recite"&&!M.shown;
  let h='<div class="row sp"><button class="btn soft sm" id="mExit">خروج</button><span class="pill">خطوة '+n(M.i+1)+' من '+n(M.steps.length)+'</span></div><div style="height:8px"></div>';
  h+='<div class="pl-bar"><i style="width:'+Math.round(M.i/M.steps.length*100)+'%"></i></div><div style="height:12px"></div>';
  h+='<div class="pl-mem-step"><div class="row sp"><b style="color:var(--g8)">'+name+'</b><span class="pill gold">'+n(done)+' / '+n(s.reps)+'</span></div><p style="margin:6px 0;font-weight:600">'+s.t+'</p><div class="pl-note">'+esc(labG(s.a,s.b))+'</div>';
  h+=(s.k==="recite"&&hide?'<div class="quran pl-q" style="text-align:center;color:var(--mute);font-size:18px">النص مخفي. سمّعي من حفظك ثم اكشفي للتحقق.</div>':txt(s.a,s.b,false));
  h+='<div class="row" style="margin-top:12px">';
  if(s.k==="listen"||s.k==="read")h+='<button class="btn" id="mPlay">'+(s.k==="listen"?"تشغيل ×"+n(s.reps):"تشغيل للقراءة معه")+'</button><button class="btn soft" id="mStop">إيقاف</button>';
  if(s.k==="tafsir")h+='<button class="btn" id="mTaf">عرض التفسير</button>';
  if(s.k==="recite"){h+=hide?'<button class="btn" id="mShow">اكشفي للتحقق</button>':'<button class="btn gold" id="mOk">أتقنتُها ✓</button><button class="btn bad" id="mAgain">أعيد</button>';}
  else h+='<button class="btn gold" id="mNext">'+(s.k==="listen"?"أنهيتُ الاستماع":"تمّت")+'</button>';
  h+='</div></div>';
  h+='<div class="row" style="margin-top:12px"><button class="btn ghost sm" id="mPrev">‹ الخطوة السابقة</button><button class="btn ghost sm" id="mSkip">تخطّي ›</button></div>';
  view.innerHTML=h;
  const on=(i,f)=>{const e=$(i);e&&(e.onclick=f);};
  on("#mExit",()=>{pStop();M=null;history.back();});
  on("#mPlay",()=>{window.planListen([[s.a,s.b]],{reps:1,reciter:M.reciter});});
  on("#mStop",pStop);
  on("#mTaf",()=>{const f=fromGi(s.a);showTafsir(f.s,f.a);});
  on("#mNext",()=>{pStop();M.c=0;M.i++;M.shown=false;render();});
  on("#mShow",()=>{M.shown=true;render();});
  on("#mOk",()=>{M.c++;M.shown=false;if(M.c>=s.reps){M.c=0;M.i++;}render();});
  on("#mAgain",()=>{M.shown=false;render();});
  on("#mPrev",()=>{pStop();M.c=0;M.i=Math.max(0,M.i-1);M.shown=false;render();});
  on("#mSkip",()=>{pStop();M.c=0;M.i++;M.shown=false;render();});
  // عدّاد الاستماع المتكرّر
  if(s.k==="listen"){const b=$("#mPlay");if(b)b.onclick=()=>{const sg=window.planSegs([[s.a,s.b]]);const f=sg.shift();pStart({reciter:M.reciter,s:f.s,from:f.from,to:f.to,rep:1,rr:s.reps,gap:"none",speed:1,next:false,queue:sg});};}
}
function finish(){
  pStop();
  const key=M.key,g0=M.g0,g1=M.g1;
  view.innerHTML='<div class="card" style="border-color:var(--g5)"><h2>أتممتِ خطوات الحفظ ✓</h2><p>'+esc(labG(g0,g1))+'</p><p class="muted">الآن سمّعي المقطع كاملًا ليُسجَّل إنجازك ويُحدَّد ما يحتاج إعادة.</p><div class="row"><button class="btn gold" id="fT">سمّعي بالميكروفون</button><button class="btn soft" id="fR">أعيدي المقطع كاملًا</button>'+(key?'<a class="btn ghost" style="text-decoration:none" href="#/plan/task/'+encodeURIComponent(key)+'">العودة للمهمة</a>':'<a class="btn ghost" style="text-decoration:none" href="#/plan">الخطة</a>')+'</div></div>';
  $("#fR").onclick=()=>start(g0,g1,key,M.method,M.reciter);
  $("#fT").onclick=()=>{
    const p=P.PL();
    if(key&&p){const day=P.buildDay(p,todayKey());const t=day.tasks.find(x=>x.key===key);if(t){window.planStartTasmee(t);return;}}
    const segs=tsmSegsGi(g0,g1);tsmStart(segs,labG(g0,g1));
  };
}
window.planMem=function(parts){
  if(parts[0]==="free"||!parts.length)return free();
  const g0=+parts[0],g1=+parts[1]||+parts[0];
  const p=P.PL();
  start(g0,g1,parts[2]?decodeURIComponent(parts[2]):"",p?p.cfg.method:"seq",p?p.cfg.reciter:ST.listen.reciter);
};
})();
try{const h=location.hash;if(/^#\/(plan|home|hifz|more)/.test(h)||!h)route();}catch(e){console.error(e);}
