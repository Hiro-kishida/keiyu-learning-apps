const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('./engine.js'),D=require('./data.js');
const reload=s=>{const restored=E.restore(JSON.stringify(s));assert.deepEqual(restored,s);return restored;};
function finish(s){let guard=100;while(s.session.phase!=='result'&&guard--){if(s.session.phase==='answer')E.answer(s,E.prompt(s.session).answer);reload(s);E.advance(s);reload(s);}assert.ok(guard>0);}
test('教材の正解・計算結果を問題別に保持し、丸め規則を混ぜない',()=>{
 assert.deepEqual(D.questions.map(q=>q.answer),[1,0,1,2,1,2]);
 assert.deepEqual(D.questions.map(q=>q.options[q.answer]),['ロ．24','イ．15','ロ．34','ハ．22','ロ．26','ハ．2.0']);
 assert.match(D.questions[0].explanation,/24\.5 ≒ 24/);assert.match(D.questions[4].explanation,/25\.9 ≒ 26/);
 assert.match(D.questions[5].explanation,/単相回路 → 電線2本 → 係数0.70/);
 assert.equal(D.single[3][1],35);assert.equal(D.stranded[3][1],37);assert.equal(D.cord[3][2],23);
});
test('固定2周の初回全問正解で解放、結果復元と連打で二重集計しない',()=>{
 const s=E.fresh();assert.equal(E.start(s,'random'),false);
 E.start(s,'challenge');finish(s);assert.equal(s.streak,1);assert.equal(s.unlocked,false);
 E.start(s,'challenge');finish(s);assert.equal(s.streak,2);assert.equal(s.unlocked,true);assert.equal(s.session.justUnlocked,true);
 assert.equal(E.advance(s),false);reload(s);assert.equal(s.completed.challenge,2);
});
test('誤答とヒント・表で即座に連続回数が0、再挑戦と再読込でも維持',()=>{
 for(const action of ['wrong','hint','table']){let s=E.fresh();E.start(s,'challenge');finish(s);E.start(s,'challenge');
 if(action==='wrong'){E.answer(s,0);assert.equal(E.answer(s,1),false);s=reload(s);E.advance(s);}else E.help(s,action);
 assert.equal(s.streak,0);s=reload(s);finish(s);assert.equal(s.streak,0);assert.equal(s.session.results.Q1.help,true);
 E.start(s,'challenge');finish(s);assert.equal(s.unlocked,false);E.start(s,'challenge');finish(s);assert.equal(s.unlocked,true);
 E.start(s,'challenge');E.answer(s,0);assert.equal(s.unlocked,true);
 }
});
test('基礎・手順・ランダム・復習は固定連続回数を変更しない',()=>{
 for(const mode of ['basic','guided','random','review']){const s=E.fresh();s.streak=1;s.unlocked=true;E.start(s,mode,['Q2']);
 const p=E.prompt(s.session);E.answer(s,(p.answer+1)%p.options.length);E.advance(s);finish(s);
 assert.equal(s.streak,1);assert.equal(s.completed[mode],1);assert.equal(s.session.results[s.session.order[0]].wrong,true);}
});
test('手順付きは一段階ずつ、誤答で同じ段階に留まり、問6を6段階で解く',()=>{
 let s=E.fresh();E.start(s,'guided');E.answer(s,0);assert.equal(s.session.step,0);s=reload(s);E.advance(s);assert.equal(s.session.step,0);
 E.answer(s,E.prompt(s.session).answer);E.advance(s);assert.equal(s.session.step,1);finish(s);
 assert.equal(s.session.order.length,6);assert.equal(s.session.step,5);assert.equal(s.session.results.Q1.wrong,true);
 assert.equal(s.stats.Q1.retry,1);assert.equal(s.stats.Q2.first,1);
});
test('各モードの間違えた問題だけを復習し、元の出題形式を維持',()=>{
 for(const mode of ['basic','guided','challenge']){const s=E.fresh();E.start(s,mode);const id=E.item(s.session).id,p=E.prompt(s.session);E.answer(s,(p.answer+1)%p.options.length);E.advance(s);finish(s);
 const ids=s.session.order.filter(id=>s.session.results[id].wrong);assert.deepEqual(ids,[id]);E.start(s,'review',ids,mode);reload(s);assert.equal(E.learningMode(s.session),mode);finish(s);assert.equal(s.completed.review,1);assert.equal(s.streak,0);}
});
test('ランダムは6問を重複なく出題する',()=>{
 const s=E.fresh();s.unlocked=true;const seen=new Set();for(let i=0;i<20;i++){E.start(s,'random');assert.equal(new Set(s.session.order).size,6);seen.add(s.session.order.join());reload(s);}assert.ok(seen.size>1);
});
test('壊れたデータ、範囲外の進捗・選択・偽の結果を初期化',()=>{
 for(const raw of ['{','null','{}'])assert.deepEqual(E.restore(raw),E.fresh());
 for(const mutate of [s=>s.session.step=999,s=>s.session.order[0]='Q99',s=>{s.session.phase='result';s.session.counted=true;},s=>s.session.selected=999]){const s=E.fresh();E.start(s,'guided');mutate(s);assert.deepEqual(E.restore(JSON.stringify(s)),E.fresh());}
});
function ui(storage,confirm=true){let handler;const node={focus(){},scrollIntoView(){}};const app={innerHTML:'',querySelector(){return node;},addEventListener(_,fn){handler=fn;}};const notice={hidden:true};const ctx=vm.createContext({window:{WireData:D,WireEngine:E},document:{getElementById:id=>id==='app'?app:notice},localStorage:storage,confirm:()=>confirm});vm.runInContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),ctx);return{app,notice,click(act){handler({target:{closest:()=>({disabled:false,dataset:{act},setAttribute(){}})}});}};}
test('保存不可でも練習継続できる、リセットは自アプリのキーだけ',()=>{
 const h=ui({getItem(){throw Error();},setItem(){throw Error();}});assert.equal(h.notice.hidden,false);h.click('start-basic');h.click('answer-0');assert.match(h.app.innerHTML,/正解/);h.click('next');assert.match(h.app.innerHTML,/より線/);
 const data=new Map([['other-app','keep']]);const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};const a=ui(storage);a.click('start-challenge');a.click('reset');assert.equal(data.has(E.KEY),false);assert.equal(data.get('other-app'),'keep');
});
