'use strict';
const D = window.ConstructionData, E = window.ConstructionEngine;
const app = document.getElementById('app');
const modes = { basic: '場所と記号の基礎', guided: '手順つき練習', challenge: '9問チャレンジ', random: 'ランダムチャレンジ', review: '間違えた問題の復習' };
let state;
function notice() { document.getElementById('notice').hidden = false; }
try { state = E.restore(localStorage.getItem(E.KEY)); } catch { state = E.fresh(); notice(); }
let screen = state.session ? 'session' : 'home';
let referencePlace = null;
function save() { try { localStorage.setItem(E.KEY, JSON.stringify(state)); } catch { notice(); } }
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = text => esc(text).replace(/\n/g, '<br>');
const button = (act, text, cls = '', attrs = '') => `<button type="button" data-act="${act}" class="${cls}" ${attrs}>${esc(text)}</button>`;

function home() {
  const active = state.session && state.session.phase !== 'result';
  return `<section class="welcome"><p class="eyebrow">施工法 1 · 場所から判断する</p>
    <h1 tabindex="-1">どこに、どんな工事？<br>条件を読んで、9問に挑戦。</h1>
    <p>「乾燥・湿気」と「露出・隠ぺい」を整理。<br>場所と電圧の条件を、一つずつ確かめます。</p></section>
    ${active ? `<div class="resume"><span>${modes[state.session.mode]} ${state.session.index + 1}/${state.session.order.length} を中断中</span>${button('resume', '続きから →', 'primary')}</div>` : ''}
    <section class="modes" aria-label="練習モード">
      <article><span class="number">01 / 場所を見分ける</span><h2>場所と記号の基礎</h2><p>6区分と、◎・○・□の意味。<br>表を見ながら確かめよう。</p><small>アプリ独自の基礎練習 · 9問</small>${button('start-basic', '基礎から練習 →', 'primary')}</article>
      <article><span class="number">02 / 工事を選ぶ</span><h2>手順つき練習</h2><p>場所、条件、選択肢の順に。<br>一度に答えるのは一つだけ。</p><small>教材9問 · 各3ステップ</small>${button('start-guided', '手順を確かめる →', 'primary')}</article>
      <article><span class="number">03 / 自分の力で確認</span><h2>9問チャレンジ</h2><p>教材の問題・選択肢で挑戦。<br>必要なら表やヒントを開けます。</p><small>最初は手助けなし · 固定順</small>${button('start-challenge', '9問に挑戦 →', 'primary')}</article>
    </section>
    <section class="record"><div><h2>手助けなしの連続パーフェクト</h2><p>固定9問を初回ですべて正解すると1回。<br>2回連続でランダムモードを解放します。</p></div><strong>${state.streak}<small> / 2</small></strong>
      ${button('start-random', state.unlocked ? 'ランダムモードで練習 →' : 'ランダムモード・未解放', '', state.unlocked ? '' : 'disabled')}
      <p class="small">${state.unlocked ? '✓ 解放済み。これからも自由に使えます。' : '固定チャレンジで誤答、表・ヒントの使用があると連続回数は0に戻ります。'}</p></section>
    <div class="settings">${button('sound', `音 ${state.sound ? 'ON' : 'OFF'}`, 'quiet', `aria-pressed="${state.sound}"`)}${button('reset', '学習記録をリセット', 'quiet')}</div>
    <p class="small">完了した周：${Object.entries(state.completed).map(([k,v]) => `${modes[k]} ${v}`).join(' ／ ')}</p>`;
}

function references(ref, highlight) {
  if (ref?.special) {
    const wood = ref.special === 'wood';
    return `<aside class="tables special-reference" aria-label="${wood ? '屋側電線路の施工制限' : '臨時配線の使用期限'}">
      <p class="eyebrow">${wood ? '問8 · 木造の造営物と屋側電線路' : '問9 · 屋内臨時配線'}</p>
      <h2>${wood ? '場所の表とは別の条件' : '期限は、施工完了の日から'}</h2>
      <p>${esc(D.special[ref.special])}</p>
      ${wood ? '<div class="condition">引込線の取付点 → 引込口<br>屋側電線路 ／ 木造 ／ 展開した場所</div><p>教材の正解：金属管工事は不可。</p><p class="small">この問題の条件で判断します。木造建物のあらゆる配線に一般化しません。</p>' : '<div class="period">4<span>か月以内</span></div><p>がいし引き工事 ／ 屋内 ／ 300 V以下</p><p class="small">問題の200 Vは、300 V以下の条件を満たします。</p>'}
    </aside>`;
  }
  const place = referencePlace ?? ref?.place ?? 0;
  const current = D.places[place];
  return `<aside class="tables" aria-label="施設場所と工事種別の表"><h2>場所を選んで、表を確認</h2>
    <div class="place-grid" role="group" aria-label="施設場所の6区分">${D.places.map((p,i) => button(`place-${i}`, p.name, i === place ? 'chosen' : '', `aria-pressed="${i === place}"`)).join('')}</div>
    <h3 class="place-title">${esc(current.detail)}</h3><p class="small">${esc(current.hint)}</p>
    <table><caption>表1から、この場所の列を表示</caption><thead><tr><th scope="col">工事種別</th><th scope="col">記号</th></tr></thead>
    <tbody>${D.methods.map(m => `<tr class="${highlight && ref?.methods?.includes(m.id) ? 'highlight' : ''}"><th scope="row">${highlight && ref?.methods?.includes(m.id) ? '→ ' : ''}${esc(m.name)}</th><td><abbr title="${esc(D.legend[m.cells[place]])}">${m.cells[place]}</abbr></td></tr>`).join('')}</tbody></table>
    <div class="legend"><h3>記号には、条件があります</h3>${Object.entries(D.legend).map(([symbol,text]) => `<p><b>${symbol}</b><span>${esc(text)}</span></p>`).join('')}</div>
    <p class="small">「可とう性」は、曲げることのできる性質です。□も、場所の条件を満たす必要があります。</p>
  </aside>`;
}

function quiz() {
  const s = state.session, q = E.item(s), p = E.prompt(s), r = s.results[q.id];
  const guided = E.learningMode(s) === 'guided', basic = E.learningMode(s) === 'basic';
  const ref = p.ref || q.ref;
  const referenceName = q.ref?.special ? '解説資料' : '表';
  return `<nav>${button('home', '← ホーム', 'quiet')}<span>${modes[s.mode]}</span><b>${s.index+1} / ${s.order.length}</b></nav>
    <progress value="${s.index}" max="${s.order.length}" aria-label="完了した問題数"></progress>
    <div class="learning ${s.table ? 'with-table' : ''}"><section class="question panel">
      <p class="eyebrow">${q.id} ${basic ? 'アプリ独自の基礎練習' : '教材の練習問題'}${guided ? ` · ステップ ${s.step+1}/${q.steps.length}` : ''}</p>
      <h1 tabindex="-1">${lines(q.text)}</h1>
      ${guided ? `<p class="condition">${esc(q.label)}</p>${s.step ? `<ol class="trail" aria-label="正解済みの手順">${q.steps.slice(0,s.step).map(t => `<li><span>✓ ${esc(t.text)}</span><b>${esc(t.options[t.answer])}</b></li>`).join('')}</ol>` : ''}<h2>${esc(p.text)}</h2>` : ''}
      ${!basic && !guided ? `<div class="help">${button('table', s.table ? `${referenceName}を閉じる` : `${referenceName}を見る`, '', `aria-expanded="${s.table}"`)}${button('hint', 'ヒントを見る')}</div><p class="small">${r?.help ? '手助けありとして記録しています。' : `${referenceName}・ヒントを開くと「手助けあり」になります。`}</p>` : ''}
      <div class="answers">${p.options.map((opt,i) => button(`answer-${i}`, `${s.selected === i ? '選択：' : ''}${opt}`, '', s.phase === 'answer' ? '' : 'disabled')).join('')}</div>
      ${s.hint ? `<aside class="hint" role="status"><b>確認ポイント</b><p>${lines(p.hint || q.hint || q.explanation)}</p></aside>` : ''}
      ${s.phase !== 'answer' ? `<div class="feedback ${s.phase}" tabindex="-1" role="status"><h2>${s.phase === 'correct' ? '✓ 正解！' : 'ここを確認して、もう一度'}</h2>${s.phase === 'correct' ? `<p>${lines(guided && s.step < q.steps.length-1 ? p.options[p.answer] : q.explanation)}</p>` : ''}${button('next', s.phase === 'wrong' ? 'もう一度' : guided && s.step < q.steps.length-1 ? '次の手順 →' : '次へ →', 'primary')}</div>` : ''}
    </section>${s.table ? references(ref, s.highlight) : ''}</div>`;
}

function result() {
  const s = state.session, rs = Object.values(s.results), retry = rs.filter(r => r.wrong).length, help = rs.filter(r => r.help).length;
  return `<section class="panel result"><p class="eyebrow">${modes[s.mode]} · 完了</p><h1 tabindex="-1">${retry === 0 ? '全問、最初から正解！' : '最後まで、やりきりました。'}</h1>
    <div class="scores"><div><strong>${rs.length-retry}</strong><span>最初から正解</span></div><div><strong>${retry}</strong><span>再挑戦で正解</span></div></div>
    <p>手助けあり：${help}問</p><p>固定チャレンジの連続パーフェクト：<b>${state.streak} / 2</b></p>
    ${s.justUnlocked ? '<p class="unlock">✓ ランダムモードが解放されました！</p>' : ''}
    ${s.mode === 'challenge' && help ? '<p>資料やヒントで確認できました。次は手助けなしで挑戦してみよう。</p>' : ''}
    ${retry ? button('review', '間違えた問題だけ、もう一度', 'primary') : ''}${button('again', 'もう1周')}${button('home', 'ホームへ')}
    ${retry === 0 ? `<div class="confetti" aria-hidden="true">${Array.from({length:16},(_,i) => `<i style="--i:${i}"></i>`).join('')}</div>` : ''}</section>`;
}

function render(focus = true) {
  app.innerHTML = screen === 'home' ? home() : state.session.phase === 'result' ? result() : quiz();
  if (focus) {
    const target = app.querySelector('.feedback') || app.querySelector('h1');
    target?.focus(); target?.scrollIntoView({block:'nearest'});
  }
}
let audio;
function sound() {
  if (!state.sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audio ||= new Audio();
    const play = () => {
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.connect(g); g.connect(audio.destination); o.frequency.setValueAtTime(660,t); o.frequency.setValueAtTime(880,t+.08);
      g.gain.setValueAtTime(.06,t); g.gain.exponentialRampToValueAtTime(.001,t+.2); o.start(t); o.stop(t+.21);
    };
    if (audio.state === 'suspended') audio.resume().then(play).catch(() => {}); else play();
  } catch { /* Practice remains available when audio is unsupported. */ }
}
app.addEventListener('click', ev => {
  const b = ev.target.closest('button[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.act;
  if (a === 'reset') {
    if (!confirm('このアプリの学習記録と音設定をリセットしますか？')) return;
    try { localStorage.removeItem(E.KEY); } catch { notice(); }
    state = E.fresh(); screen = 'home'; referencePlace = null; render(); return;
  }
  if (a === 'sound') {
    state.sound = !state.sound; save(); b.textContent = `音 ${state.sound ? 'ON' : 'OFF'}`; b.setAttribute('aria-pressed',state.sound); return;
  }
  if (a.startsWith('place-')) {
    referencePlace = Number(a.slice(6)); render(false); app.querySelector(`[data-act="${a}"]`)?.focus(); return;
  }
  if (a === 'home') screen = 'home';
  else if (a === 'resume') screen = 'session';
  else if (a.startsWith('start-')) {
    if (state.session && state.session.phase !== 'result' && !confirm('進行中の周を終了して、新しい練習を始めますか？')) return;
    if (!E.start(state,a.slice(6))) return;
    screen = 'session';
  } else if (a.startsWith('answer-')) {
    if (!E.answer(state,Number(a.slice(7)))) return;
    if (state.session.phase === 'correct') sound();
  } else if (a === 'next') { if (!E.advance(state)) return; }
  else if (a === 'table') {
    if (state.session.table) state.session.table = false; else E.help(state,'table');
    save(); render(false); app.querySelector('[data-act="table"]')?.focus(); return;
  } else if (a === 'hint') E.help(state,'hint');
  else if (a === 'review') {
    const old = state.session;
    E.start(state,'review',old.order.filter(id => old.results[id].wrong),E.learningMode(old));
  } else if (a === 'again') {
    const old = state.session;
    E.start(state,old.mode,old.mode === 'review' ? old.order : undefined,E.learningMode(old));
  }
  referencePlace = null; save(); render();
});
render(false);
