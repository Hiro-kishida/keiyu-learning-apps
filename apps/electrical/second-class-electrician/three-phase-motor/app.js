'use strict';
const M = window.Motor;
let state;
try { state = M.restore(localStorage.getItem(M.KEY)); } catch { state = M.fresh(); storageFailed(); }
let view = state.session ? (state.session.phase === 'result' ? 'result' : 'quiz') : 'home';
const app = document.getElementById('app');
function storageFailed() { document.getElementById('storage-notice').hidden = false; }
function save() { try { localStorage.setItem(M.KEY, JSON.stringify(state)); } catch { storageFailed(); } }
const modeName = mode => mode === 'fixed' ? '固定モード' : 'ランダムモード';
function button(action, text, cls = '', extra = '') { return `<button type="button" data-action="${action}" class="${cls}" ${extra}>${text}</button>`; }
function streak() { return `<div class="streak"><div><span class="eyebrow">固定モード・連続パーフェクト</span><strong>${state.streak}<small> / 2</small></strong></div><div class="steps" aria-hidden="true"><i class="${state.streak >= 1 ? 'filled' : ''}"></i><i class="${state.streak >= 2 ? 'filled' : ''}"></i></div><p>${state.unlocked ? '✓ ランダムモード解放済み' : '2周連続パーフェクトでランダムモードを解放'}</p></div>`; }
function home() {
  const active = state.session && state.session.phase !== 'result';
  return `<section class="home"><div class="intro"><p class="eyebrow">三相誘導電動機 / 7問トレーニング</p><h1 tabindex="-1">4つの基本を、<br>ひとつずつ攻略。</h1><p class="lead">公式を見ながらで大丈夫。<br>間違えたら確認して、もう一度。</p><ol class="topics"><li><span>01</span><div><b>同期速度</b><small>周波数と極数から求める</small></div></li><li><span>02</span><div><b>周波数</b><small>回転速度との関係</small></div></li><li><span>03</span><div><b>コンデンサ</b><small>接続・取り付け位置・目的</small></div></li><li><span>04</span><div><b>逆回転</b><small>2本の電源線を入れ替える</small></div></li></ol></div><div class="panel start-panel"><p class="eyebrow">LET’S PRACTICE</p><h2>7問で、1周。</h2><p>選択問題6問 ＋ 配線操作1問</p>${active ? `<div class="resume-note">${modeName(state.session.mode)} ${state.session.index + 1}/7 を中断中</div>${button('resume', '続きから練習 →', 'primary')}` : ''}${button('fixed', '固定モードで練習 →', active ? '' : 'primary', active ? 'disabled' : '')}${button('random', state.unlocked ? 'ランダムモード →' : 'ランダムモード・未解放', '', !state.unlocked || active ? 'disabled' : '')}${streak()}<div class="settings">${button('sound', `音 ${state.sound ? 'ON' : 'OFF'}`, 'quiet', `aria-pressed="${state.sound}"`)}${button('reset', '学習記録リセット', 'quiet')}</div><p class="small">完了した周：固定 ${state.completed.fixed} ／ ランダム ${state.completed.random}</p></div></section>`;
}
function wiring(s) {
  const xs = [70, 170, 270], colors = ['#087d86', '#9b5a0c', '#6355a4'];
  const reverse = s.phase === 'correct';
  const connections = s.wires.map((w, i) => `${'ABC'[i]} → ${'UVW'[w]}`).join('、');
  return `<div class="wiring"><svg viewBox="0 0 340 305" role="img" aria-label="${reverse ? '逆回転' : '正回転'}。接続：${connections}"><rect x="30" y="12" width="280" height="92" rx="18" fill="#e8f0ed"/><text x="170" y="43" text-anchor="middle" class="svg-title">三相誘導電動機</text><text x="170" y="79" text-anchor="middle" class="rotation">${reverse ? '↶ 逆回転' : '↷ 正回転'}</text>${s.wires.map((w, i) => `<path d="M ${xs[i]} 255 C ${xs[i]} 196, ${xs[w]} 175, ${xs[w]} 112" fill="none" stroke="${colors[i]}" stroke-width="5"/>`).join('')}${xs.map((x, i) => `<circle cx="${x}" cy="112" r="17" fill="#123c46"/><text x="${x}" y="118" text-anchor="middle" fill="white">${'UVW'[i]}</text><circle cx="${x}" cy="255" r="18" fill="${colors[i]}"/><text x="${x}" y="261" text-anchor="middle" fill="white">${'ABC'[i]}</text>`).join('')}<text x="170" y="298" text-anchor="middle">三相電源</text></svg><p class="connections">${connections}</p><p class="small">模式図です。色と正回転の向きは実物の配線規格を表しません。</p></div><div class="wire-buttons" role="group" aria-label="入れ替える電源線を2本選ぶ">${[0, 1, 2].map(i => button(`wire-${i}`, `${'ABC'[i]}${s.selectedWires.includes(i) ? ' ✓' : ''}`, s.selectedWires.includes(i) ? 'selected' : '', `aria-pressed="${s.selectedWires.includes(i)}" ${s.phase !== 'answer' ? 'disabled' : ''}`)).join('')}</div><p id="wire-message" role="status" class="small">${s.phase === 'answer' ? '電源線を2本選んでください。再タップで選択解除。' : '✓ 2本の接続先を入れ替えました。'}</p>${s.phase === 'answer' ? button('swap', '2本を入れ替える', 'primary', s.selectedWires.length === 2 ? '' : 'disabled') : ''}`;
}
function quiz() {
  const s = state.session, q = M.getQuestion(s.order[s.index]);
  return `<section class="quiz"><div class="quiz-nav">${button('home', '← 中断してホーム', 'quiet')}<span>${modeName(s.mode)}</span></div><div class="progress-label"><span>ステージ ${q.stage}</span><b>${s.index + 1}<small> / 7</small></b></div><progress value="${s.index}" max="7" aria-label="完了した問題数">${s.index}/7</progress><div class="panel question"><p class="eyebrow">${q.id} ${q.id === 'Q7' ? '配線を操作' : '答えをひとつ選ぶ'}</p><h1 tabindex="-1">${q.text}</h1>${['Q1', 'Q2'].includes(q.id) ? '<aside class="formula"><b>同期速度 N<sub>s</sub> = 120 × f ÷ p</b><span>f：周波数（Hz）、p：極数</span><span>min⁻¹：1分間の回転数</span></aside>' : ''}${q.id === 'Q7' ? wiring(s) : `<div class="answers">${s.choiceOrder.map(id => { const c = q.choices.find(c => c.id === id); return button(`answer-${id}`, `${s.phase !== 'answer' && id === s.selectedAnswer ? '選択：' : ''}${c.text}`, s.phase !== 'answer' && id === q.correct ? 'right-answer' : '', s.phase !== 'answer' ? 'disabled' : ''); }).join('')}</div>`}${['correct', 'wrong'].includes(s.phase) ? `<div class="feedback ${s.phase}" tabindex="-1" role="status"><h2>${s.phase === 'correct' ? '✓ 正解！' : 'ここを確認して、もう一度'}</h2><p>${q.explanation}</p>${button('advance', s.phase === 'wrong' ? 'もう一度' : '次へ →', 'primary')}</div>` : ''}</div></section>`;
}
function result() {
  const s = state.session, score = Object.values(s.first).filter(Boolean).length;
  return `<section class="result panel"><p class="eyebrow">${modeName(s.mode)} / 1周完了</p><h1 tabindex="-1">${s.hadWrong ? '7問、やりきりました。' : 'パーフェクト！'}</h1><p>初回正解数</p><div class="score">${score}<span> / 7問</span></div><p>${s.hadWrong ? '解説で確認したところを、次の1周で試してみよう。' : '選択問題はすべて初回正解。配線操作も完了！'}</p>${s.justUnlocked ? '<p class="unlock">✓ ランダムモードが解放されました！</p>' : ''}${streak()}${button(`again-${s.mode}`, 'もう1周 →', 'primary')}${button('home', 'ホームへ')}${!s.hadWrong ? '<div class="confetti" aria-hidden="true">' + Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join('') + '</div>' : ''}</section>`;
}
function render(focus = false) {
  app.innerHTML = view === 'home' ? home() : view === 'quiz' ? quiz() : result();
  if (focus) {
    const feedback = app.querySelector('.feedback');
    (feedback || app.querySelector('h1')).focus();
    if (feedback) feedback.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
let audioContext;
function sound() {
  if (!state.sound) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ||= new Context();
    const play = () => {
      const osc = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
      osc.connect(gain); gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(660, now); osc.frequency.setValueAtTime(880, now + .08);
      gain.gain.setValueAtTime(.07, now); gain.gain.exponentialRampToValueAtTime(.001, now + .22);
      osc.start(now); osc.stop(now + .23);
    };
    if (audioContext.state === 'suspended') audioContext.resume().then(play).catch(() => {}); else play();
  } catch { /* 音声を利用できない環境でも練習を続ける。 */ }
}
app.addEventListener('click', event => {
  const target = event.target.closest('button[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'reset') {
    if (!window.confirm('三相モーター攻略の学習記録と音設定をリセットしますか？')) return;
    try { localStorage.removeItem(M.KEY); } catch { storageFailed(); }
    state = M.fresh(); view = 'home'; render(true); return;
  }
  if (action === 'sound') { state.sound = !state.sound; save(); target.textContent = `音 ${state.sound ? 'ON' : 'OFF'}`; target.setAttribute('aria-pressed', state.sound); return; }
  if (action === 'home') view = 'home';
  else if (action === 'resume') view = 'quiz';
  else if (action === 'fixed' || action === 'random' || action.startsWith('again-')) { if (!M.start(state, action.replace('again-', ''))) return; view = 'quiz'; }
  else if (action.startsWith('answer-')) { if (!M.answer(state, action.slice(7))) return; if (state.session.phase === 'correct') sound(); }
  else if (action.startsWith('wire-')) {
    if (!M.selectWire(state, Number(action.slice(5)))) { document.getElementById('wire-message').textContent = '2本を選んで入れ替えてください'; return; }
    save(); render(); app.querySelector(`[data-action="${action}"]`).focus(); return;
  }
  else if (action === 'swap') { if (!M.swap(state)) return; sound(); }
  else if (action === 'advance') { if (!M.advance(state)) return; view = state.session.phase === 'result' ? 'result' : 'quiz'; }
  save(); render(true);
});
render();
