const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('./engine.js');
const reload = state => { const copy = M.restore(JSON.stringify(state)); assert.deepEqual(copy, state); return copy; };
function correct(state, pair = [0, 1]) {
  const q = M.getQuestion(state.session.order[state.session.index]);
  if (q.id === 'Q7') { pair.forEach(i => M.selectWire(state, i)); assert.equal(M.swap(state), true); }
  else assert.equal(M.answer(state, q.correct), true);
}
function finish(state) {
  while (state.session.phase !== 'result') {
    if (state.session.phase === 'answer') correct(state);
    reload(state);
    M.advance(state);
    reload(state);
  }
}
test('固定順、初回正解7問、結果の再読込と連打で二重加算しない', () => {
  let state = M.fresh(); M.start(state, 'fixed');
  assert.deepEqual(state.session.order, M.questions.map(q => q.id));
  finish(state); state = reload(state);
  assert.equal(state.completed.fixed, 1); assert.equal(state.streak, 1);
  assert.equal(Object.values(state.session.first).filter(Boolean).length, 7);
  assert.equal(M.advance(state), false); assert.equal(state.completed.fixed, 1);
});
test('パーフェクト→誤答→パーフェクトでは未解放、次のパーフェクトで永続解放', () => {
  let state = M.fresh(); M.start(state, 'fixed'); finish(state);
  M.start(state, 'fixed'); M.answer(state, 'Q1-0');
  assert.equal(state.streak, 0); state = reload(state);
  assert.equal(state.session.phase, 'wrong'); assert.equal(M.answer(state, 'Q1-2'), false);
  M.advance(state); assert.equal(state.session.index, 0); correct(state); state = reload(state);
  assert.equal(state.stats.Q1.firstCorrect, 1); assert.equal(state.stats.Q1.wrong, 1);
  finish(state); assert.equal(state.session.hadWrong, true);
  assert.equal(Object.values(state.session.first).filter(Boolean).length, 6);
  M.start(state, 'fixed'); finish(state); assert.equal(state.unlocked, false);
  M.start(state, 'fixed'); finish(state); assert.equal(state.unlocked, true); assert.equal(state.session.justUnlocked, true);
  state = reload(state); M.start(state, 'fixed'); M.answer(state, 'Q1-0');
  assert.equal(state.unlocked, true); assert.equal(state.streak, 0);
});
test('ランダムは7問が1回ずつ、固定連続数に影響しない', () => {
  const state = M.fresh(); assert.equal(M.start(state, 'random'), false);
  state.unlocked = true; state.streak = 1; M.start(state, 'random');
  assert.equal(new Set(state.session.order).size, 7);
  const q = M.getQuestion(state.session.order[0]);
  if (q.id === 'Q7') { correct(state); M.advance(state); }
  const current = M.getQuestion(state.session.order[state.session.index]);
  M.answer(state, current.choices.find(c => c.id !== current.correct).id); M.advance(state);
  finish(state); assert.equal(state.streak, 1); assert.equal(state.completed.random, 1);
});
for (const [pair, expected] of [[[0, 1], [1, 0, 2]], [[0, 2], [2, 1, 0]], [[1, 2], [0, 2, 1]]]) {
  test(`配線${pair}：準備操作、3本目拒否、交換、再読込、再出題`, () => {
    let state = M.fresh(); M.start(state, 'fixed');
    for (let i = 0; i < 6; i++) { correct(state); M.advance(state); }
    assert.equal(M.swap(state), false); M.selectWire(state, pair[0]);
    assert.equal(M.swap(state), false); M.selectWire(state, pair[0]);
    assert.deepEqual(state.session.selectedWires, []);
    pair.forEach(i => M.selectWire(state, i)); state = reload(state);
    assert.equal(M.selectWire(state, [0, 1, 2].find(i => !pair.includes(i))), false);
    assert.deepEqual(state.session.selectedWires, pair);
    assert.equal(M.swap(state), true); assert.deepEqual(state.session.wires, expected);
    assert.equal(M.swap(state), false); assert.equal(M.selectWire(state, 0), false);
    assert.equal(state.stats.Q7.wrong, 0); assert.equal(state.stats.Q7.firstCorrect, 1);
    state = reload(state); M.advance(state); M.start(state, 'fixed');
    for (let i = 0; i < 6; i++) { correct(state); M.advance(state); }
    assert.deepEqual(state.session.wires, [0, 1, 2]); assert.deepEqual(state.session.selectedWires, []);
  });
}
test('不正な保存データを初期化、進行中の上書きを拒否', () => {
  for (const raw of ['{', 'null', '{}', '{"schemaVersion":99}']) assert.deepEqual(M.restore(raw), M.fresh());
  const state = M.fresh(); M.start(state, 'fixed'); assert.equal(M.start(state, 'fixed'), false);
  state.session.order[0] = 'INVALID'; assert.deepEqual(M.restore(JSON.stringify(state)), M.fresh());
  const invalid = M.fresh(); M.start(invalid, 'fixed'); invalid.session.phase = 'result'; invalid.session.counted = true;
  assert.deepEqual(M.restore(JSON.stringify(invalid)), M.fresh());
});
