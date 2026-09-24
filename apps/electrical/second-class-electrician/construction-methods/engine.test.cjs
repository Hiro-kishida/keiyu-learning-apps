const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const D = require('./data.js'), E = require('./engine.js');
function reload(s) { const copy = E.restore(JSON.stringify(s)); assert.deepEqual(copy,s); return copy; }
function finish(s) {
  let guard = 100;
  while (s.session.phase !== 'result' && guard--) {
    if (s.session.phase === 'answer') assert.equal(E.answer(s,E.prompt(s.session).answer),true);
    reload(s); E.advance(s); reload(s);
  }
  assert.ok(guard > 0);
}
test('教材9問の解答記号と選択肢を照合', () => {
  assert.equal(D.questions.length,9);
  assert.deepEqual(D.questions.map(q => q.answer),[0,2,1,2,1,3,2,0,1]);
  assert.deepEqual(D.questions.map(q => q.options[q.answer]),[
    'イ．金属ダクト工事','ハ．フロアダクト工事','ロ．バスダクト工事','ハ．合成樹脂管工事',
    'ロ．点検できる隠ぺい場所であって、乾燥した場所のライティングダクト工事',
    'ニ．金属管工事','ハ．金属ダクト工事','イ．金属管工事','ロ．4か月'
  ]);
  assert.match(D.questions[6].text,/三相3線式200/);
  assert.match(D.questions[7].text,/取付点から引込口/);
  assert.match(D.questions[8].text,/工事が完了した日から/);
});
test('教材表の12行×6区分、電圧条件、1種と2種を区別', () => {
  assert.deepEqual(D.methods.map(m => m.cells.join('')), [
    '◎◎◎◎——','○—○———','◎◎◎◎◎◎','◎◎◎◎◎◎','◎◎◎◎◎◎','□—□———',
    '◎—◎———','◎—◎———','○—○———','——○—○—','————○—','◎◎◎◎◎◎'
  ]);
  assert.match(D.legend['○'],/300 V以下/);
  assert.match(D.legend['□'],/300 Vを超える場合.*電動機.*可とう性/);
  assert.match(D.legend['◎'],/水気.*湿気/);
});
test('問3の一般化を修正し、問8・9は別資料、全ステップ参照が有効', () => {
  assert.match(D.questions[2].explanation,/「すべてのダクトが不可」とは覚えません/);
  assert.deepEqual(D.questions[7].ref,{special:'wood'});
  assert.deepEqual(D.questions[8].ref,{special:'temporary'});
  for (const q of [...D.questions,...D.basics]) {
    for (const p of [q,...q.steps || []]) {
      assert.ok(p.options[p.answer]);
      if (p.ref.special) assert.ok(D.special[p.ref.special]);
      else { assert.ok(D.places[p.ref.place]); for (const id of p.ref.methods || []) assert.ok(D.methods.some(m => m.id === id)); }
    }
  }
});
test('全モードは9問、手順練習は各3段階、保存復元で進捗を維持', () => {
  for (const mode of ['basic','guided','challenge']) {
    const s=E.fresh();E.start(s,mode);assert.equal(s.session.order.length,9);finish(s);
    assert.equal(Object.values(s.session.results).filter(r=>r.done).length,9);
    assert.equal(s.completed[mode],1);assert.equal(E.advance(s),false);reload(s);
  }
  assert.ok(D.questions.every(q=>q.steps.length===3));
});
test('初回・手助けなしを2周連続で解放、結果再読込で二重集計しない', () => {
  const s=E.fresh();assert.equal(E.start(s,'random'),false);
  E.start(s,'challenge');finish(s);assert.equal(s.streak,1);assert.equal(s.unlocked,false);
  E.start(s,'challenge');finish(s);reload(s);assert.equal(s.streak,2);assert.equal(s.unlocked,true);
  assert.equal(s.session.justUnlocked,true);assert.equal(E.advance(s),false);assert.equal(s.completed.challenge,2);
});
test('誤答・表・ヒントで即座に連続回数0、復元と再挑戦後も同じ', () => {
  for (const action of ['wrong','table','hint']) {
    let s=E.fresh();E.start(s,'challenge');finish(s);E.start(s,'challenge');
    if(action==='wrong') {E.answer(s,1);assert.equal(E.answer(s,0),false);s=reload(s);E.advance(s);}
    else E.help(s,action);
    assert.equal(s.streak,0);s=reload(s);finish(s);assert.equal(s.streak,0);
    assert.equal(s.session.results.Q1.help,true);
    E.start(s,'challenge');finish(s);assert.equal(s.unlocked,false);
    E.start(s,'challenge');finish(s);assert.equal(s.unlocked,true);
    E.start(s,'challenge');E.answer(s,1);assert.equal(s.unlocked,true);
  }
});
test('手順の誤答は同じ段階で再挑戦、正解済みの段階を保持', () => {
  const s=E.fresh();E.start(s,'guided');E.answer(s,1);E.advance(s);
  assert.equal(s.session.step,1);E.answer(s,0);reload(s);E.advance(s);
  assert.equal(s.session.step,1);finish(s);assert.equal(s.stats.Q1.retry,1);
  assert.equal(s.stats.Q2.first,1);
});
test('基礎・手順・ランダム・復習は固定連続数を変えない', () => {
  for(const mode of ['basic','guided','random','review']){
    const s=E.fresh();s.streak=1;s.unlocked=true;E.start(s,mode,['Q8','Q9']);
    const p=E.prompt(s.session);E.answer(s,(p.answer+1)%p.options.length);E.advance(s);finish(s);
    assert.equal(s.streak,1);assert.equal(s.completed[mode],1);
  }
});
test('誤答のみ復習は元モードを維持し、ランダムは重複なし', () => {
  for(const mode of ['basic','guided','challenge']){
    const s=E.fresh();E.start(s,mode);const id=E.item(s.session).id,p=E.prompt(s.session);
    E.answer(s,(p.answer+1)%p.options.length);E.advance(s);finish(s);
    const missed=s.session.order.filter(id=>s.session.results[id].wrong);assert.deepEqual(missed,[id]);
    E.start(s,'review',missed,mode);reload(s);finish(s);assert.equal(s.completed.review,1);
  }
  const s=E.fresh();s.unlocked=true;
  for(let i=0;i<10;i++){E.start(s,'random');assert.equal(new Set(s.session.order).size,9);assert.deepEqual([...s.session.order].sort(),D.questions.map(q=>q.id));}
});
test('壊れた保存や不正な進捗を初期化', () => {
  for(const raw of ['{','null','{}'])assert.deepEqual(E.restore(raw),E.fresh());
  for(const mutate of [s=>s.session.step=100,s=>s.session.order[0]='Q99',s=>{s.session.phase='result';s.session.counted=true;}]){
    const s=E.fresh();E.start(s,'guided');mutate(s);assert.deepEqual(E.restore(JSON.stringify(s)),E.fresh());
  }
});
function ui(storage, confirm = true) {
  let handler;
  const node={focus(){},scrollIntoView(){}};
  const app={innerHTML:'',querySelector(){return node;},addEventListener(_,fn){handler=fn;}};
  const notice={hidden:true};
  const context=vm.createContext({window:{ConstructionData:D,ConstructionEngine:E},document:{getElementById:id=>id==='app'?app:notice},localStorage:storage,confirm:()=>confirm});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),context);
  return {app,notice,click(act){handler({target:{closest:()=>({disabled:false,dataset:{act},setAttribute(){}})}});}};
}
test('保存不可でも練習継続、リセットは専用キーだけ', () => {
  const h=ui({getItem(){throw Error('denied');},setItem(){throw Error('quota');}});
  assert.equal(h.notice.hidden,false);h.click('start-basic');h.click('answer-0');assert.match(h.app.innerHTML,/正解/);h.click('next');assert.match(h.app.innerHTML,/B2/);
  const data=new Map([['wire-ampacity-v01','keep'],['three-phase-motor-v01','keep']]);
  const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const a=ui(storage);a.click('start-challenge');a.click('reset');assert.equal(data.has(E.KEY),false);
  assert.equal(data.get('wire-ampacity-v01'),'keep');assert.equal(data.get('three-phase-motor-v01'),'keep');
  const b=ui(storage,false);b.click('start-challenge');const before=data.get(E.KEY);b.click('reset');assert.equal(data.get(E.KEY),before);
});
test('問8・9では場所の表の代わりに専用解説を表示', () => {
  for(const [id,title] of [['Q8','屋側電線路'],['Q9','臨時配線']]){
    const s=E.fresh();E.start(s,'review',[id],'challenge');
    const h=ui({getItem:()=>JSON.stringify(s),setItem(){}});h.click('hint');
    assert.match(h.app.innerHTML,new RegExp(title));assert.doesNotMatch(h.app.innerHTML,/施設場所の6区分/);
  }
});
