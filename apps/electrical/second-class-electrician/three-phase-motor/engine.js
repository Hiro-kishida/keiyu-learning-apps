(function (root) {
  'use strict';
  const KEY = 'three-phase-motor-v01';
  const questions = [
    { id: 'Q1', stage: '1 同期速度', text: '電源周波数60 Hz、4極の三相誘導電動機の同期速度は？', choices: ['1200 min⁻¹', '1500 min⁻¹', '1800 min⁻¹', '3000 min⁻¹'], correct: 2, explanation: '120 × 60 ÷ 4 = 1800 min⁻¹。同期速度は回転磁界の速度で、通常の電動機運転では実際の回転速度はこれより少し遅くなります。' },
    { id: 'Q2', stage: '1 同期速度', text: '電源周波数60 Hz、6極の三相誘導電動機の同期速度は？', choices: ['600 min⁻¹', '1200 min⁻¹', '1800 min⁻¹', '3600 min⁻¹'], correct: 1, explanation: '120 × 60 ÷ 6 = 1200 min⁻¹。周波数が同じなら、極数が多いほど同期速度は小さくなります。' },
    { id: 'Q3', stage: '2 周波数', text: '同じ三相誘導電動機を無負荷で運転します。電源周波数を60 Hzから50 Hzに変えると、回転速度はどうなる？', choices: ['低下する', '増加する', '変わらない', '回転しなくなる'], correct: 0, explanation: '極数が同じなら、周波数が下がると同期速度が下がり、無負荷での回転速度も低下します。' },
    { id: 'Q4', stage: '3 コンデンサ', text: '力率改善用コンデンサは、電動機とどのように接続する？', choices: ['並列', '直列'], correct: 0, explanation: 'コンデンサは電動機と並列に接続します。' },
    { id: 'Q5', stage: '3 コンデンサ', text: '電動機と並列につなぐ力率改善用コンデンサは、電動機用の手元開閉器のどちら側に取り付ける？', choices: ['負荷側（電動機側）', '電源側'], correct: 0, explanation: '負荷側とは電動機側です。電動機の停止時にコンデンサも電源から切り離せる位置に取り付けます。' },
    { id: 'Q6', stage: '3 コンデンサ', text: '電動機と並列につなぐコンデンサの目的は？', choices: ['力率を改善する', '回転方向を逆にする', '電源の周波数を変える', '振動を防ぐ'], correct: 0, explanation: '目的は回路の力率改善です。' },
    { id: 'Q7', stage: '4 逆回転', text: '三相3本の電源線のうち、2本を選んで入れ替え、電動機を逆回転させてください。', choices: [], correct: null, explanation: '三相3本のうち、どれか2本を入れ替えると相順が変わり、回転方向が逆になります。' }
  ].map(q => ({ ...q, choices: q.choices.map((text, i) => ({ id: `${q.id}-${i}`, text })), correct: q.correct === null ? null : `${q.id}-${q.correct}` }));
  const ids = questions.map(q => q.id);
  const getQuestion = id => questions.find(q => q.id === id);
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  };
  const fresh = () => ({ schemaVersion: 1, unlocked: false, streak: 0, completed: { fixed: 0, random: 0 }, stats: Object.fromEntries(ids.map(id => [id, { firstCorrect: 0, wrong: 0 }])), sound: false, session: null });
  function prepare(s) {
    s.phase = 'answer'; s.choiceOrder = shuffle(getQuestion(s.order[s.index]).choices.map(c => c.id));
    s.selectedAnswer = null; s.wires = [0, 1, 2]; s.selectedWires = [];
  }
  function start(state, mode) {
    if (!['fixed', 'random'].includes(mode) || (mode === 'random' && !state.unlocked)) return false;
    if (state.session && state.session.phase !== 'result') return false;
    state.session = { mode, order: mode === 'fixed' ? [...ids] : shuffle(ids), index: 0, first: {}, hadWrong: false, counted: false, justUnlocked: false };
    prepare(state.session); return true;
  }
  function answer(state, choiceId) {
    const s = state.session;
    if (!s || s.phase !== 'answer') return false;
    const q = getQuestion(s.order[s.index]);
    if (!q.choices.some(c => c.id === choiceId)) return false;
    const correct = choiceId === q.correct;
    s.selectedAnswer = choiceId;
    record(state, correct);
    return true;
  }
  function record(state, correct) {
    const s = state.session, id = s.order[s.index];
    if (!(id in s.first)) { s.first[id] = correct; if (correct) state.stats[id].firstCorrect++; }
    if (!correct) { state.stats[id].wrong++; s.hadWrong = true; if (s.mode === 'fixed') state.streak = 0; }
    s.phase = correct ? 'correct' : 'wrong';
  }
  function selectWire(state, wire) {
    const s = state.session;
    if (!s || s.phase !== 'answer' || s.order[s.index] !== 'Q7' || ![0, 1, 2].includes(wire)) return false;
    if (s.selectedWires.includes(wire)) s.selectedWires = s.selectedWires.filter(i => i !== wire);
    else if (s.selectedWires.length < 2) s.selectedWires.push(wire);
    else return false;
    return true;
  }
  function swap(state) {
    const s = state.session;
    if (!s || s.phase !== 'answer' || s.order[s.index] !== 'Q7' || s.selectedWires.length !== 2) return false;
    const [a, b] = s.selectedWires;
    [s.wires[a], s.wires[b]] = [s.wires[b], s.wires[a]];
    record(state, true); return true;
  }
  function advance(state) {
    const s = state.session;
    if (!s) return false;
    if (s.phase === 'wrong') { prepare(s); return true; }
    if (s.phase !== 'correct') return false;
    if (s.index < 6) { s.index++; prepare(s); return true; }
    if (!s.counted) {
      state.completed[s.mode]++;
      if (s.mode === 'fixed' && !s.hadWrong) state.streak = Math.min(2, state.streak + 1);
      s.justUnlocked = !state.unlocked && state.streak >= 2;
      state.unlocked ||= s.justUnlocked;
      s.counted = true;
    }
    s.phase = 'result'; return true;
  }
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const permutation = (a, b) => Array.isArray(a) && a.length === b.length && new Set(a).size === b.length && a.every(v => b.includes(v));
  function valid(state) {
    if (!state || state.schemaVersion !== 1 || typeof state.sound !== 'boolean' || typeof state.unlocked !== 'boolean' || !integer(state.streak) || state.streak > 2 || (state.streak === 2 && !state.unlocked)) return false;
    if (!state.completed || !['fixed', 'random'].every(m => integer(state.completed[m])) || !state.stats || !ids.every(id => state.stats[id] && integer(state.stats[id].firstCorrect) && integer(state.stats[id].wrong))) return false;
    const s = state.session;
    if (s === null) return true;
    if (!s || !['fixed', 'random'].includes(s.mode) || (s.mode === 'random' && !state.unlocked) || !permutation(s.order, ids) || (s.mode === 'fixed' && s.order.some((id, i) => id !== ids[i])) || !integer(s.index) || s.index > 6 || !['answer', 'wrong', 'correct', 'result'].includes(s.phase)) return false;
    if (!s.first || typeof s.first !== 'object' || Array.isArray(s.first) || !Object.keys(s.first).every(id => ids.includes(id) && typeof s.first[id] === 'boolean') || typeof s.hadWrong !== 'boolean' || typeof s.counted !== 'boolean' || typeof s.justUnlocked !== 'boolean') return false;
    if (s.hadWrong !== Object.values(s.first).includes(false) || (s.mode === 'fixed' && s.hadWrong && state.streak !== 0)) return false;
    if (s.counted !== (s.phase === 'result') || (s.phase === 'result' && s.index !== 6)) return false;
    if (!s.order.slice(0, s.index).every(id => id in s.first) || s.order.slice(s.index + 1).some(id => id in s.first)) return false;
    const q = getQuestion(s.order[s.index]);
    if (!permutation(s.choiceOrder, q.choices.map(c => c.id)) || !permutation(s.wires, [0, 1, 2]) || !Array.isArray(s.selectedWires) || s.selectedWires.length > 2 || new Set(s.selectedWires).size !== s.selectedWires.length || !s.selectedWires.every(i => [0, 1, 2].includes(i))) return false;
    if (s.phase !== 'answer' && !(q.id in s.first)) return false;
    if (s.phase === 'answer' && (s.first[q.id] === true || s.selectedAnswer !== null)) return false;
    if (q.id === 'Q7') {
      const changed = s.wires.filter((w, i) => w !== i).length;
      if (s.phase === 'wrong' || s.selectedAnswer !== null || (s.phase === 'answer' ? changed !== 0 : changed !== 2 || s.selectedWires.length !== 2)) return false;
    } else {
      if (s.phase !== 'answer' && !q.choices.some(c => c.id === s.selectedAnswer)) return false;
      if (s.phase === 'wrong' && (s.selectedAnswer === q.correct || s.first[q.id] !== false)) return false;
      if (['correct', 'result'].includes(s.phase) && s.selectedAnswer !== q.correct) return false;
    }
    return true;
  }
  function restore(raw) { try { const state = JSON.parse(raw); return valid(state) ? state : fresh(); } catch { return fresh(); } }
  const api = { KEY, questions, getQuestion, fresh, start, answer, selectWire, swap, advance, restore, valid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Motor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
