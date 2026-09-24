(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./data.js'):root.WireData;
const KEY='wire-ampacity-v01';
const fresh=()=>({schemaVersion:1,sound:false,streak:0,unlocked:false,completed:{basic:0,guided:0,challenge:0,random:0,review:0},stats:{},session:null});
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const learningMode=s=>s.mode==='review'?s.sourceMode:s.mode;
const item=s=>(learningMode(s)==='basic'?D.basics:D.questions).find(q=>q.id===s.order[s.index]);
const prompt=s=>learningMode(s)==='guided'?item(s).steps[s.step]:item(s);
function prepare(s){s.step=0;s.phase='answer';s.selected=null;s.hint=false;s.table=learningMode(s)==='basic'||learningMode(s)==='guided';s.highlight=false;}
function start(st,mode,reviewIds,sourceMode="challenge"){
 if(!['basic','guided','challenge','random','review'].includes(mode)||mode==='random'&&!st.unlocked)return false;
 if(!['basic','guided','challenge','random'].includes(sourceMode))return false;
 const ids=((mode==='review'?sourceMode:mode)==='basic'?D.basics:D.questions).map(q=>q.id);
 let order=mode==='random'?shuffle(ids):ids;
 if(mode==='review'){if(!Array.isArray(reviewIds)||!reviewIds.length||reviewIds.some(id=>!ids.includes(id)))return false;order=[...new Set(reviewIds)];}
 st.session={mode,sourceMode,order,index:0,results:{},counted:false,justUnlocked:false};prepare(st.session);return true;
}
const record=s=>s.results[item(s).id]||=( {wrong:false,help:s.table,done:false} );
function help(st,type){const s=st.session;if(!s||s.phase==='result')return false;const r=record(s);r.help=true;if(s.mode==='challenge')st.streak=0;s[type==='table'?'table':'hint']=true;s.highlight=type==='hint';if(type==='hint')s.table=true;return true;}
function answer(st,index){const s=st.session;if(!s||s.phase!=='answer')return false;const p=prompt(s);if(!Number.isInteger(index)||index<0||index>=p.options.length)return false;
 const r=record(s);s.selected=index;
 if(index!==p.answer){r.wrong=true;r.help=true;s.phase='wrong';s.hint=true;s.table=true;s.highlight=true;if(s.mode==='challenge')st.streak=0;}
 else {s.phase='correct';if(learningMode(s)!=='guided'||s.step===item(s).steps.length-1)r.done=true;}
 return true;
}
function advance(st){const s=st.session;if(!s||!['wrong','correct'].includes(s.phase))return false;
 if(s.phase==='wrong'){s.phase='answer';s.selected=null;return true;}
 if(learningMode(s)==='guided'&&s.step<item(s).steps.length-1){s.step++;s.phase='answer';s.selected=null;s.hint=false;s.highlight=false;return true;}
 if(s.index<s.order.length-1){s.index++;prepare(s);return true;}
 if(!s.counted){st.completed[s.mode]++;for(const [id,r] of Object.entries(s.results)){const v=st.stats[id]||={first:0,retry:0,help:0};v[r.wrong?'retry':'first']++;if(r.help)v.help++;}
 if(s.mode==='challenge'){const perfect=Object.values(s.results).every(r=>!r.wrong&&!r.help);st.streak=perfect?Math.min(2,st.streak+1):0;s.justUnlocked=!st.unlocked&&st.streak===2;st.unlocked ||= s.justUnlocked;}
 s.counted=true;}s.phase='result';return true;
}
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function restore(raw){try{const st=JSON.parse(raw);if(!st||st.schemaVersion!==1||typeof st.sound!=='boolean'||typeof st.unlocked!=='boolean'||!integer(st.streak)||st.streak>2||st.streak===2&&!st.unlocked||!st.completed||!['basic','guided','challenge','random','review'].every(k=>integer(st.completed[k]))||!st.stats||Object.entries(st.stats).some(([id,v])=>!/^([QB])[1-6]$/.test(id)||!v||!['first','retry','help'].every(k=>integer(v[k]))))throw 0;
 const s=st.session;if(s!==null){if(!s||!Object.keys(st.completed).includes(s.mode)||s.mode==='random'&&!st.unlocked||!Array.isArray(s.order)||!s.order.length||new Set(s.order).size!==s.order.length||!integer(s.index)||s.index>=s.order.length||!integer(s.step)||!['answer','wrong','correct','result'].includes(s.phase)||typeof s.counted!=='boolean'||s.counted!==(s.phase==='result')||!['table','hint','highlight','justUnlocked'].every(k=>typeof s[k]==='boolean'))throw 0;
 if(!['basic','guided','challenge','random'].includes(s.sourceMode))throw 0;
 const ids=(learningMode(s)==='basic'?D.basics:D.questions).map(q=>q.id);if(s.order.some(id=>!ids.includes(id))||s.mode!=='review'&&s.order.length!==6||!s.results||Array.isArray(s.results))throw 0;
 if(['basic','guided','challenge'].includes(s.mode)&&s.order.some((id,i)=>id!==ids[i]))throw 0;
 const q=item(s);if(learningMode(s)==='guided'?s.step>=q.steps.length:s.step!==0)throw 0;
 if(Object.entries(s.results).some(([id,r])=>!s.order.includes(id)||!r||!['wrong','help','done'].every(k=>typeof r[k]==='boolean')))throw 0;
 if(s.order.slice(0,s.index).some(id=>!s.results[id]?.done)||s.order.slice(s.index+1).some(id=>s.results[id]))throw 0;
 if(s.phase==='result'&&(s.index!==s.order.length-1||s.order.some(id=>!s.results[id]?.done)))throw 0;
 if(s.phase==='answer'?s.selected!==null:!integer(s.selected)||s.selected>=prompt(s).options.length)throw 0;
 if(s.phase==='wrong'&&(!s.results[q.id]?.wrong||s.selected===prompt(s).answer))throw 0;
 if(['correct','result'].includes(s.phase)&&s.selected!==prompt(s).answer)throw 0;
 if(s.mode==='challenge'&&Object.values(s.results).some(r=>r.wrong||r.help)&&st.streak!==0)throw 0;
 }return st;}catch{return fresh();}}
const api={KEY,fresh,start,learningMode,item,prompt,answer,advance,help,restore};if(typeof module!=='undefined')module.exports=api;else root.WireEngine=api;
})(globalThis);
