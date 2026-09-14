const QUESTIONS = [
  { place: "爆燃性粉じん", answer: false },
  { place: "可燃性ガス", answer: false },
  { place: "可燃性粉じん", answer: true },
  { place: "危険物", answer: true },
];

const STORAGE = { unlocked: "electrical-stage2-unlocked", streak: "electrical-stage1-perfect-streak" };
let stage2Unlocked = localStorage.getItem(STORAGE.unlocked) === "true";
let perfectStreak = Number(localStorage.getItem(STORAGE.streak) || "0");
let game = null;
let audioContext;

const screens = { home: document.querySelector("#home-screen"), quiz: document.querySelector("#quiz-screen"), result: document.querySelector("#result-screen") };
const el = {
  modeButtons: document.querySelector("#mode-buttons"), modeLabel: document.querySelector("#mode-label"), count: document.querySelector("#question-count"), progress: document.querySelector("#progress-bar"), number: document.querySelector("#question-number"), question: document.querySelector("#question-text"), feedback: document.querySelector("#feedback"), yes: document.querySelector("#answer-true"), no: document.querySelector("#answer-false"), kicker: document.querySelector("#result-kicker"), title: document.querySelector("#result-title"), message: document.querySelector("#result-message"), actions: document.querySelector("#result-actions"),
};

function show(name) { Object.entries(screens).forEach(([key, screen]) => screen.classList.toggle("hidden", key !== name)); }
function shuffle(items) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function makeTone(frequency, duration, type = "sine", volume = 0.06, delay = 0) {
  try {
    audioContext ||= new AudioContext(); const ctx = audioContext; const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = frequency; gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay); gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + .015); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration); osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + duration + .02);
  } catch (_) { /* Sound is optional when browser audio is unavailable. */ }
}
function playCorrect() { makeTone(660, .14, "sine", .045); makeTone(880, .18, "sine", .04, .11); }
function playMiss() { makeTone(250, .16, "triangle", .025); }

function renderHome() {
  el.modeButtons.innerHTML = stage2Unlocked
    ? '<button class="primary-button" type="button" data-mode="stage1">固定4問</button><button class="secondary-button" type="button" data-mode="stage2">ランダム4問</button>'
    : '<button class="primary-button" type="button" data-mode="stage1">スタート</button>';
  el.modeButtons.querySelectorAll("button").forEach(button => button.addEventListener("click", () => start(button.dataset.mode)));
}
function start(mode) {
  game = { mode, questions: mode === "stage2" ? shuffle(QUESTIONS) : [...QUESTIONS], index: 0, allFirstTry: true, locked: false };
  show("quiz"); renderQuestion();
}
function renderQuestion() {
  const q = game.questions[game.index]; game.locked = false; el.yes.disabled = false; el.no.disabled = false;
  el.modeLabel.textContent = game.mode === "stage1" ? "固定4問" : "ランダム4問";
  el.count.textContent = `${game.index + 1} / 4`; el.progress.style.width = `${(game.index + 1) * 25}%`;
  el.number.textContent = `QUESTION ${String(game.index + 1).padStart(2, "0")}`; el.question.textContent = `${q.place}の場所で、`;
  el.feedback.textContent = ""; el.feedback.className = "feedback";
}
function answer(value) {
  if (!game || game.locked) return; game.locked = true; el.yes.disabled = true; el.no.disabled = true;
  const q = game.questions[game.index];
  if (value !== q.answer) {
    game.allFirstTry = false; playMiss(); el.feedback.textContent = `× 合成樹脂管は${q.answer ? "使えます。" : "使えません。"}`; el.feedback.classList.add("miss");
    window.setTimeout(renderQuestion, 950); return;
  }
  playCorrect(); el.feedback.textContent = "正解！"; el.feedback.classList.add("hit");
  window.setTimeout(() => { game.index += 1; game.index < 4 ? renderQuestion() : finish(); }, 520);
}
function finish() {
  const wasPerfect = game.allFirstTry;
  let unlockedNow = false;
  if (game.mode === "stage1") {
    perfectStreak = wasPerfect ? perfectStreak + 1 : 0; localStorage.setItem(STORAGE.streak, String(perfectStreak));
    if (!stage2Unlocked && perfectStreak >= 2) { stage2Unlocked = true; unlockedNow = true; localStorage.setItem(STORAGE.unlocked, "true"); }
  }
  el.kicker.textContent = game.mode === "stage1" ? "STAGE 1" : "STAGE 2";
  el.actions.innerHTML = "";
  if (wasPerfect) {
    el.title.textContent = "4 / 4！";
    el.message.textContent = unlockedNow ? "🎉 ランダムモード解放！" : "すべて初回正解！";
    addAction("もう1回", () => start(game.mode), true);
    if (stage2Unlocked && game.mode === "stage1") addAction("ランダム4問へ", () => start("stage2"));
  } else {
    el.title.textContent = "できた！";
    el.message.textContent = "まちがえた問題は、その場で解き直しました。";
    addAction("もう1回", () => start(game.mode), true);
  }
  show("result");
}
function addAction(label, action, primary = false) { const button = document.createElement("button"); button.type = "button"; button.className = primary ? "primary-button" : "secondary-button"; button.textContent = label; button.addEventListener("click", action); el.actions.append(button); }
el.yes.addEventListener("click", () => answer(true)); el.no.addEventListener("click", () => answer(false));
renderHome();
