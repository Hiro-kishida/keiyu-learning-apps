const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const M = require('./engine.js');
function harness(storage, confirm = true) {
  let click;
  const notice = { hidden: true };
  const node = { focus() {}, scrollIntoView() {} };
  const app = { innerHTML: '', addEventListener(type, fn) { click = fn; }, querySelector() { return node; } };
  const context = vm.createContext({ window: { Motor: M, confirm: () => confirm, scrollTo() {} }, document: { getElementById: id => id === 'app' ? app : notice }, localStorage: storage });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), context);
  return { app, notice, click(action) { click({ target: { closest: () => ({ disabled: false, dataset: { action }, setAttribute() {} }) } }); } };
}
test('保存の読み書きが拒否されても、音OFFで回答を続けられる', () => {
  const h = harness({ getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } });
  assert.equal(h.notice.hidden, false); assert.match(h.app.innerHTML, /音 OFF/);
  h.click('fixed'); h.click('answer-Q1-0'); assert.match(h.app.innerHTML, /ここを確認して/);
  h.click('advance'); h.click('answer-Q1-2'); assert.match(h.app.innerHTML, /✓ 正解/);
  h.click('advance'); assert.match(h.app.innerHTML, /Q2/);
});
test('書き込みのみ失敗する環境でも案内を表示する', () => {
  const h = harness({ getItem() { return null; }, setItem() { throw Error('quota'); } });
  h.click('fixed'); assert.equal(h.notice.hidden, false); assert.match(h.app.innerHTML, /Q1/);
});
test('壊れた保存データから起動、確認後はアプリのキーのみ削除', () => {
  const data = new Map([[M.KEY, '{broken'], ['another-app', 'preserve']]);
  const storage = { getItem: k => data.get(k), setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
  const h = harness(storage); h.click('fixed'); h.click('reset');
  assert.equal(data.has(M.KEY), false); assert.equal(data.get('another-app'), 'preserve');
  assert.match(h.app.innerHTML, /固定モードで練習/);
  const cancelled = harness(storage, false); cancelled.click('fixed'); const before = data.get(M.KEY); cancelled.click('reset');
  assert.equal(data.get(M.KEY), before);
});
